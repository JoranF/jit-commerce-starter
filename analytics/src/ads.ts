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
 * Stop-loss: met ADS_AUTOPILOT=true pauzeert het script alle sets zodra het testplan
 * "stoppen" zegt (uit met ADS_STOP_LOSS=false). ADS_DAILY_REPORT=true: elke dag naar de webhook.
 */
import { cpa, decideAds, decideAdsets, linkCtr, stopLossAdsets, testPhaseVerdict, DEFAULT_TEST_PLAN, type AdStats } from "./ads-rules"
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
  if (!process.env.META_ADS_TOKEN) {
    // Account staat al in stores.ts, maar de token (GitHub-secret META_ADS_TOKEN) nog niet: niet falen.
    console.log(`${store.name}: META_ADS_TOKEN ontbreekt, advertentiecheck overgeslagen.`)
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
    impressions: i.impressions,
    linkClicks: i.linkClicks,
    addToCarts: i.addToCarts,
  }))

  const adDecisions = decideAds(ads, rules)
  const adsets = await meta.adsets([...new Set(ads.filter((a) => a.status === "ACTIVE").map((a) => a.adsetId))])
  const pausing = new Set(adDecisions.filter((d) => d.action === "pause").map((d) => d.ad.adId))
  const setDecisions = decideAdsets(ads, adsets, rules, pausing)

  // Testplan (stap A/B) over de hele looptijd van de test: ADS_TEST_DAYS (standaard 30).
  const testDays = Number(process.env.ADS_TEST_DAYS || 30)
  const testAds = testDays === days ? ads : await adsForDays(meta, ph, account, testDays)
  const verdict = testPhaseVerdict(testAds, { ...DEFAULT_TEST_PLAN, ...store.meta.testPlan })
  const icon = { loopt: "⏳", stoppen: "🛑", doorgaan: "✅", twijfel: "🤔" }[verdict.verdict]

  const stopLoss = autopilot && process.env.ADS_STOP_LOSS !== "false" ? stopLossAdsets(ads, verdict) : []

  const done: string[] = []
  if (stopLoss.length) {
    // Hele test stoppen: per-advertentie-acties en opschalen zijn dan niet meer zinvol.
    for (const id of stopLoss) {
      await meta.pauseAdset(id)
      const name = ads.find((a) => a.adsetId === id)?.adsetName ?? id
      done.push(`🛑 Stop-loss, set gepauzeerd: ${name} (${verdict.reason})`)
    }
  } else if (autopilot) {
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
    `**Testplan (${verdict.phase}, laatste ${testDays} dagen): ${icon} ${verdict.verdict}**: ${verdict.reason}.`,
    "",
    table(
      ["Uitgaven", "Bestellingen", "Omzet (incl. btw)", "CPA", "Doel-CPA", "Break-even CPA", "ROAS"],
      [[eur(spend), int(orders), eur(rev), orders ? eur(spend / orders) : "–", store.meta.targetCpa ? eur(store.meta.targetCpa) : "–", eur(rules.breakEvenCpa), spend ? (rev / spend).toFixed(2) : "–"]]
    ),
    "",
    ads.length
      ? table(
          ["Advertentie", "Set", "Status", "Uitgaven", "CTR (link)", "In winkelmand", "Best. (PostHog)", "Aank. (Meta)", "CPA", "Besluit"],
          adDecisions.map((d) => [
            d.ad.adName,
            d.ad.adsetName,
            d.ad.status,
            eur(d.ad.spend),
            linkCtr(d.ad) === null ? "–" : `${linkCtr(d.ad)!.toFixed(2).replace(".", ",")}%`,
            int(d.ad.addToCarts ?? 0),
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
  if (actionable || done.length || process.env.ADS_DAILY_REPORT === "true" || verdict.verdict === "stoppen" || verdict.verdict === "doorgaan" || process.argv.includes("--always-publish")) {
    await publish(`ads-${new Date().toISOString().slice(0, 10)}`, md)
  }
}

/** Zelfde koppeling als hierboven, maar over een andere periode (voor het testplan). */
async function adsForDays(meta: MetaAds, ph: PostHogApi, account: string, days: number): Promise<AdStats[]> {
  const [insights, revenue] = await Promise.all([meta.adInsights(account, days), getAdRevenue(ph, days)])
  const byAd = new Map(revenue.map((r) => [r.adId, r]))
  return insights.map((i) => ({
    adId: i.adId,
    adName: i.adName,
    adsetId: i.adsetId,
    adsetName: i.adsetName,
    campaignName: i.campaignName,
    status: "UNKNOWN",
    spend: i.spend,
    orders: byAd.get(i.adId)?.orders ?? 0,
    revenue: byAd.get(i.adId)?.revenue ?? 0,
    metaPurchases: i.purchases,
    impressions: i.impressions,
    linkClicks: i.linkClicks,
    addToCarts: i.addToCarts,
  }))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
