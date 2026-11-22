/**
 * Beslisregels voor advertenties. Puur (geen API's), zodat ze getest zijn.
 *
 * Per advertentie over de laatste N dagen:
 *  - uitgaven (Meta) en bestellingen + omzet (PostHog order_completed met ad_ad,
 *    dus echte bestellingen, niet wat Meta zelf toeschrijft)
 *  - CPA = uitgaven / bestellingen, vergeleken met de break-even CPA van de winkel
 *
 * Regels (bewust voorzichtig; liever te laat dan te vroeg):
 *  1. PAUZEREN: ≥ 2× break-even uitgegeven en 0 bestellingen,
 *     of ≥ 3× break-even uitgegeven en CPA > 1,5× break-even.
 *     Nooit de laatste actieve advertentie in een advertentieset.
 *  2. OPSCHALEN (advertentieset): ≥ 3 bestellingen en CPA ≤ 0,7× break-even,
 *     gerekend over de advertenties die blijven lopen.
 *     Dagbudget +20%, hooguit één keer per 72 uur, nooit boven het maximum.
 *  3. Anders: LATEN LOPEN (te weinig data of rond break-even).
 */
export type AdStats = {
  adId: string
  adName: string
  adsetId: string
  adsetName: string
  campaignName: string
  status: string
  spend: number
  /** Bestellingen volgens PostHog (ad_ad = adId). */
  orders: number
  revenue: number
  /** Ter vergelijking: aankopen volgens Meta. */
  metaPurchases: number
}

export type AdsetInfo = {
  id: string
  name: string
  /** Dagbudget in EUR (Meta rekent in centen; omgerekend door de client). */
  dailyBudget: number | null
  /** Laatste wijziging (ISO), om niet vaker dan 1×/72u op te schalen. */
  updatedTime?: string
}

export type Rules = {
  breakEvenCpa: number
  /** Maximaal dagbudget per advertentieset (EUR). */
  maxDailyBudget: number
  scaleStep: number
  now?: Date
}

export type AdDecision =
  | { action: "pause"; ad: AdStats; reason: string }
  | { action: "keep"; ad: AdStats; reason: string }

export type AdsetDecision = {
  action: "scale"
  adset: AdsetInfo
  from: number
  to: number
  reason: string
}

const eur = (n: number) => `€${n.toFixed(2).replace(".", ",")}`

export const cpa = (a: Pick<AdStats, "spend" | "orders">) => (a.orders ? a.spend / a.orders : Infinity)

export function decideAds(ads: AdStats[], rules: Rules): AdDecision[] {
  const be = rules.breakEvenCpa
  const activePerAdset = new Map<string, number>()
  for (const a of ads) {
    if (a.status === "ACTIVE") activePerAdset.set(a.adsetId, (activePerAdset.get(a.adsetId) ?? 0) + 1)
  }

  // Slechtste eerst, zodat bij "niet de laatste" de beste blijft staan.
  const sorted = [...ads].sort((x, y) => cpa(y) - cpa(x) || y.spend - x.spend)
  const out: AdDecision[] = []
  for (const ad of sorted) {
    if (ad.status !== "ACTIVE") continue
    let reason: string | null = null
    if (ad.orders === 0 && ad.spend >= 2 * be) {
      reason = `${eur(ad.spend)} uitgegeven (≥ 2× break-even ${eur(be)}) zonder bestelling`
    } else if (ad.orders > 0 && ad.spend >= 3 * be && cpa(ad) > 1.5 * be) {
      reason = `CPA ${eur(cpa(ad))} is > 1,5× break-even (${eur(be)}) na ${eur(ad.spend)}`
    }
    const left = activePerAdset.get(ad.adsetId) ?? 0
    if (reason && left > 1) {
      activePerAdset.set(ad.adsetId, left - 1)
      out.push({ action: "pause", ad, reason })
    } else if (reason) {
      out.push({ action: "keep", ad, reason: `${reason}, maar het is de laatste actieve advertentie in de set` })
    } else {
      const why =
        ad.orders === 0
          ? `nog te weinig uitgegeven (${eur(ad.spend)} van ${eur(2 * be)})`
          : `CPA ${eur(cpa(ad))} (break-even ${eur(be)})`
      out.push({ action: "keep", ad, reason: why })
    }
  }
  return out
}

/**
 * `pausing`: advertenties die nu gepauzeerd worden. Een set wordt beoordeeld op
 * de advertenties die blijven lopen; een verliezer die eruit gaat telt niet mee.
 */
export function decideAdsets(
  ads: AdStats[],
  adsets: AdsetInfo[],
  rules: Rules,
  pausing: Set<string> = new Set()
): AdsetDecision[] {
  const be = rules.breakEvenCpa
  const now = rules.now ?? new Date()
  const out: AdsetDecision[] = []
  for (const set of adsets) {
    const own = ads.filter((a) => a.adsetId === set.id && a.status === "ACTIVE" && !pausing.has(a.adId))
    const spend = own.reduce((n, a) => n + a.spend, 0)
    const orders = own.reduce((n, a) => n + a.orders, 0)
    if (orders < 3 || !set.dailyBudget) continue
    const setCpa = spend / orders
    if (setCpa > 0.7 * be) continue
    if (set.updatedTime && now.getTime() - new Date(set.updatedTime).getTime() < 72 * 3600_000) continue
    const to = Math.min(Math.round(set.dailyBudget * (1 + rules.scaleStep) * 100) / 100, rules.maxDailyBudget)
    if (to <= set.dailyBudget) continue
    out.push({
      action: "scale",
      adset: set,
      from: set.dailyBudget,
      to,
      reason: `${orders} bestellingen, CPA ${eur(setCpa)} ≤ 0,7× break-even (${eur(be)})`,
    })
  }
  return out
}
