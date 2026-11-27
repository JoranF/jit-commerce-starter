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
 *  3. VROEG PAUZEREN (creative): ≥ 3000 vertoningen, ≥ 0,6× break-even uitgegeven en
 *     linkklik-CTR < 0,6%. Een advertentie die niemand aanklikt wordt nooit goedkoop per
 *     verkoop; dit scheelt tientallen euro's per verliezer. Alleen als Meta de cijfers geeft.
 *  4. Anders: LATEN LOPEN (te weinig data of rond break-even).
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
  /** Optioneel (Meta): voor de vroege creative-regel en het rapport. */
  impressions?: number
  linkClicks?: number
  addToCarts?: number
}

/** Linkklik-CTR in procenten; null zonder vertoningen. */
export const linkCtr = (a: Pick<AdStats, "impressions" | "linkClicks">) =>
  a.impressions ? ((a.linkClicks ?? 0) / a.impressions) * 100 : null

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
    const ctr = linkCtr(ad)
    if (!reason && ad.orders === 0 && (ad.impressions ?? 0) >= 3000 && ad.spend >= 0.6 * be && ctr !== null && ctr < 0.6) {
      reason = `linkklik-CTR ${ctr.toFixed(2).replace(".", ",")}% na ${ad.impressions} vertoningen en ${eur(ad.spend)}: de advertentie trekt geen klikken`
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

/**
 * Testfase van een nieuw product (hele account, niet per advertentie). Uit het testplan:
 *  - Stap A, na `stepASpend` (€150): STOPPEN als de CPC > `maxCpc` (€1,20) of als er nog
 *    niemand iets in de winkelmand heeft gelegd. Dan ligt het aan de advertentie of het product,
 *    niet aan het budget.
 *  - Stap B, na `stepBSpend` (€300): DOORGAAN als de kosten per verkoop ≤ `continueCpa` (€55);
 *    STOPPEN als die > `stopCpa` (€70) zijn én minder dan `minAtcRate` (3%) van de klikken in
 *    de winkelmand eindigt (of er geen verkoop is). Daartussen: TWIJFEL, nieuwe creatives proberen.
 * Puur advies: het script pauzeert hierop niets, het zet het oordeel bovenaan het rapport.
 */
export type TestPlan = {
  stepASpend: number
  maxCpc: number
  stepBSpend: number
  continueCpa: number
  stopCpa: number
  /** Fractie, 0.03 = 3% van de linkklikken legt iets in de winkelmand. */
  minAtcRate: number
}

export const DEFAULT_TEST_PLAN: TestPlan = {
  stepASpend: 150,
  maxCpc: 1.2,
  stepBSpend: 300,
  continueCpa: 55,
  stopCpa: 70,
  minAtcRate: 0.03,
}

export type TestVerdict = {
  phase: "voor stap A" | "stap A" | "stap B"
  verdict: "loopt" | "stoppen" | "doorgaan" | "twijfel"
  reason: string
  spend: number
  cpc: number | null
  atcRate: number | null
  cpa: number | null
}

/**
 * Stop-loss: zegt het testplan "stoppen", dan gaan alle advertentiesets met een actieve
 * advertentie op pauze (alleen met ADS_AUTOPILOT=true, uit te zetten met ADS_STOP_LOSS=false).
 * Zo kost een mislukte test nooit meer dan stap A of stap B, ook als je een paar dagen niet
 * kijkt. Weer starten = in Ads Manager zelf aanzetten én ADS_STOP_LOSS=false (anders pauzeert
 * de volgende run ze opnieuw, want het oordeel kijkt 30 dagen terug).
 */
export function stopLossAdsets(ads: AdStats[], verdict: Pick<TestVerdict, "verdict">): string[] {
  if (verdict.verdict !== "stoppen") return []
  return [...new Set(ads.filter((a) => a.status === "ACTIVE").map((a) => a.adsetId))]
}

export function testPhaseVerdict(ads: AdStats[], plan: TestPlan = DEFAULT_TEST_PLAN): TestVerdict {
  const sum = (f: (a: AdStats) => number) => ads.reduce((n, a) => n + f(a), 0)
  const spend = sum((a) => a.spend)
  const clicks = sum((a) => a.linkClicks ?? 0)
  const atc = sum((a) => a.addToCarts ?? 0)
  const orders = sum((a) => a.orders)
  const cpc = clicks ? spend / clicks : null
  const atcRate = clicks ? atc / clicks : null
  const cpaNow = orders ? spend / orders : null
  const pct = (n: number) => `${(n * 100).toFixed(1).replace(".", ",")}%`
  const base = { spend, cpc, atcRate, cpa: cpaNow }

  if (spend < plan.stepASpend) {
    return { ...base, phase: "voor stap A", verdict: "loopt", reason: `${eur(spend)} van ${eur(plan.stepASpend)} uitgegeven; nog te vroeg voor een oordeel` }
  }
  if (spend < plan.stepBSpend) {
    if (cpc === null || cpc > plan.maxCpc) {
      return { ...base, phase: "stap A", verdict: "stoppen", reason: cpc === null ? `${eur(spend)} uitgegeven zonder linkklikken` : `CPC ${eur(cpc)} is hoger dan ${eur(plan.maxCpc)} na ${eur(spend)}` }
    }
    if (atc === 0 && orders === 0) {
      return { ...base, phase: "stap A", verdict: "stoppen", reason: `${eur(spend)} uitgegeven en nog niemand heeft iets in de winkelmand gelegd` }
    }
    return { ...base, phase: "stap A", verdict: "loopt", reason: `CPC ${eur(cpc)} en ${atc} keer in winkelmand: door naar ${eur(plan.stepBSpend)}` }
  }
  if (cpaNow !== null && cpaNow <= plan.continueCpa) {
    return { ...base, phase: "stap B", verdict: "doorgaan", reason: `kosten per verkoop ${eur(cpaNow)} ≤ ${eur(plan.continueCpa)} na ${eur(spend)}` }
  }
  if ((cpaNow === null || cpaNow > plan.stopCpa) && (atcRate === null || atcRate < plan.minAtcRate)) {
    return {
      ...base,
      phase: "stap B",
      verdict: "stoppen",
      reason: `${cpaNow === null ? "geen verkoop" : `kosten per verkoop ${eur(cpaNow)}`} en ${atcRate === null ? "geen klikken" : `${pct(atcRate)} in winkelmand`} na ${eur(spend)}`,
    }
  }
  return {
    ...base,
    phase: "stap B",
    verdict: "twijfel",
    reason: `${cpaNow === null ? "nog geen verkoop" : `kosten per verkoop ${eur(cpaNow)}`}, ${atcRate === null ? "geen klikken" : `${pct(atcRate)} in winkelmand`}: probeer nieuwe creatives voor je meer uitgeeft`,
  }
}
