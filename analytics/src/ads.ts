/**
 * `npm run ads -- --store <id>` — dagelijkse check van de Meta-advertenties.
 *
 * Koppelt uitgaven per advertentie (Meta) aan echte bestellingen per advertentie
 * (PostHog, via utm_content={{ad.id}} → ad_ad) en past de regels uit
 * ads-rules.ts toe: verliezers pauzeren, winnende advertentiesets opschalen.
 *
 * Standaard alleen ADVIES (rapport, niets aangepast). Pas met ADS_AUTOPILOT=true
 * voert het script de acties echt uit. Begin een paar weken met advies.
 *
 * Instellingen per winkel in src/stores.ts (meta.adAccountId, meta.breakEvenCpa).
 * ADS_DAYS (standaard 7), ADS_MAX_DAILY_BUDGET (EUR, standaard 50), ADS_SCALE_STEP (0.2).
 */
import { cpa, decideAds, decideAdsets, type AdStats } from "./ads-rules"
import { MetaAds } from "./meta"
import { eur, int, publish, table } from "./notify"
import { PostHogApi, envFromProcess } from "./posthog"
import { getAdRevenue } from "./queries"
import { currentStore } from "./stores"

async function main() {
  const store = currentStore()
  if (!store) throw new Error("Kies een winkel: npm run ads -- --store <id>")
  if (!store.meta?.adAccountId) {
    console.log(`${store.name}: geen Meta-advertentieaccount in src/stores.ts, niets te doen.`)
    return
  }
  const days = Number(process.env.ADS_DAYS || 7)
  const autopilot = process.env.ADS_AUTOPILOT === "true"
  const rules = {
    breakEvenCpa: store.meta.breakEvenCpa,
    maxDailyBudget: Number(process.env.ADS_MAX_DAILY_BUDGET || 50),
    scaleStep: Number(process.env.ADS_SCALE_STEP || 0.2),
  }

  const meta = MetaAds.fromEnv()
  const ph = new PostHogApi(envFromProcess())
  const account = store.meta.adAccountId

  const [insights, statuses, revenue] = await Promise.all([
    meta.adInsights(account, days),
    meta.adStatuses(account),
    getAdRevenue(ph, days),
  ])
  const byAd = new Map(revenue.map((r) => [r.adId, r]))

  const ads: AdStats[] = insights.map((i) => ({
    adId: i.adId,
    adName: i.adName,
    adsetId: i.adsetId,
    adsetName: i.adsetName,
    campaignName: i.campaignName,
    status: statuses.get(i.adId) ?? "UNKNOWN",
    spend: i.spend,
    orders: byAd.get(i.adId)?.orders ?? 0,
    revenue: byAd.get(i.adId)?.revenue ?? 0,
    metaPurchases: i.purchases,
  }))

  const adDecisions = decideAds(ads, rules)
  const adsets = await meta.adsets([...new Set(ads.filter((a) => a.status === "ACTIVE").map((a) => a.adsetId))])
  const pausing = new Set(adDecisions.filter((d) => d.action === "pause").map((d) => d.ad.adId))
  const setDecisions = decideAdsets(ads, adsets, rules, pausing)

  const done: string[] = []
  if (autopilot) {
    for (const d of adDecisions) {
      if (d.action !== "pause") continue
      await meta.pauseAd(d.ad.adId)
      done.push(`⏸️ Gepauzeerd: ${d.ad.adName} (${d.reason})`)
    }
    for (const d of setDecisions) {
      await meta.setDailyBudget(d.adset.id, d.to)
      done.push(`📈 Opgeschaald: ${d.adset.name} ${eur(d.from)} → ${eur(d.to)}/dag (${d.reason})`)
    }
  }

  // Ongekoppelde bestellingen: advertenties zonder UTM-tags of buiten Meta.
  const linked = new Set(ads.map((a) => a.adId))
  const unlinkedOrders = revenue.filter((r) => !linked.has(r.adId)).reduce((n, r) => n + r.orders, 0)
  const spend = ads.reduce((n, a) => n + a.spend, 0)
  const orders = ads.reduce((n, a) => n + a.orders, 0)
  const rev = ads.reduce((n, a) => n + a.revenue, 0)

  const md = [
    `## 📣 Advertenties — laatste ${days} dagen (${new Date().toLocaleDateString("nl-NL")})`,
    "",
    table(
      ["Uitgaven", "Bestellingen", "Omzet (incl. btw)", "CPA", "Break-even CPA", "ROAS"],
      [[eur(spend), int(orders), eur(rev), orders ? eur(spend / orders) : "–", eur(rules.breakEvenCpa), spend ? (rev / spend).toFixed(2) : "–"]]
    ),
    "",
    ads.length
      ? table(
          ["Advertentie", "Set", "Status", "Uitgaven", "Best. (PostHog)", "Aank. (Meta)", "CPA", "Besluit"],
          adDecisions.map((d) => [
            d.ad.adName,
            d.ad.adsetName,
            d.ad.status,
            eur(d.ad.spend),
            int(d.ad.orders),
            int(d.ad.metaPurchases),
            Number.isFinite(cpa(d.ad)) ? eur(cpa(d.ad)) : "–",
            `${d.action === "pause" ? "⏸️ pauzeren" : "▶️ laten lopen"}: ${d.reason}`,
          ])
        )
      : "_Geen advertenties met uitgaven in deze periode._",
    "",
    setDecisions.length
      ? "**Opschalen:**\n" + setDecisions.map((d) => `- ${d.adset.name}: ${eur(d.from)} → ${eur(d.to)}/dag (${d.reason})`).join("\n")
      : "_Geen advertentieset om op te schalen._",
    unlinkedOrders
      ? `\n⚠️ ${unlinkedOrders} bestelling(en) met een advertentie-ID dat niet in dit account staat. Klopt utm_content={{ad.id}}?`
      : "",
    orders === 0 && spend > 0
      ? "\n⚠️ Uitgaven maar geen gekoppelde bestellingen. Staan de UTM-parameters op de advertenties (zie README → Advertenties)?"
      : "",
    "",
    autopilot
      ? done.length
        ? `**Uitgevoerd (ADS_AUTOPILOT):**\n${done.map((d) => `- ${d}`).join("\n")}`
        : "_Autopilot aan; niets te doen._"
      : "_Adviesmodus: er is niets aangepast. Zet ADS_AUTOPILOT=true om dit automatisch te laten doen._",
  ].join("\n")

  console.log(md)
  const actionable = adDecisions.some((d) => d.action === "pause") || setDecisions.length > 0
  if (actionable || done.length || process.argv.includes("--always-publish")) {
    await publish(`ads-${new Date().toISOString().slice(0, 10)}`, md)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
