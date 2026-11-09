/**
 * Statistiek voor A/B-tests op conversie (binomiaal).
 *
 * - Bayesiaans: P(variant > control) met Beta(1 + conversies, 1 + niet-conversies)
 *   priors, geschat met Monte Carlo. Makkelijk uit te leggen: "94% kans dat B beter is".
 * - Frequentistisch: tweezijdige two-proportion z-test als controle.
 */

export type VariantResult = {
  variant: string
  exposed: number
  converted: number
  revenue: number
}

export type Comparison = {
  variant: string
  conversionRate: number
  controlRate: number
  relativeLift: number
  probabilityToBeBest: number
  probabilityBetterThanControl: number
  pValue: number
  revenuePerVisitor: number
}

/** Deterministische RNG (mulberry32) zodat rapporten reproduceerbaar zijn. */
export function rng(seed = 42) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function normal(rand: () => number) {
  // Box-Muller
  let u = 0
  let v = 0
  while (u === 0) u = rand()
  while (v === 0) v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Gamma(shape, 1) via Marsaglia-Tsang. */
function gamma(shape: number, rand: () => number): number {
  if (shape < 1) {
    return gamma(shape + 1, rand) * Math.pow(rand(), 1 / shape)
  }
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (;;) {
    let x: number
    let v: number
    do {
      x = normal(rand)
      v = 1 + c * x
    } while (v <= 0)
    v = v * v * v
    const u = rand()
    if (u < 1 - 0.0331 * x ** 4) return d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}

export function sampleBeta(a: number, b: number, rand: () => number) {
  const x = gamma(a, rand)
  const y = gamma(b, rand)
  return x / (x + y)
}

/** Standaard-normale CDF (Abramowitz-Stegun benadering). */
export function normalCdf(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}

export function twoProportionPValue(c1: number, n1: number, c2: number, n2: number) {
  if (n1 === 0 || n2 === 0) return 1
  const p1 = c1 / n1
  const p2 = c2 / n2
  const p = (c1 + c2) / (n1 + n2)
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))
  if (se === 0) return 1
  const z = (p2 - p1) / se
  return 2 * (1 - normalCdf(Math.abs(z)))
}

/**
 * Vergelijk alle varianten met "control".
 * @param draws aantal Monte Carlo trekkingen (20k is ruim genoeg voor ±0,5%)
 */
export function compareVariants(
  results: VariantResult[],
  controlKey = "control",
  draws = 20_000,
  seed = 42
): Comparison[] {
  const control = results.find((r) => r.variant === controlKey)
  if (!control) throw new Error(`Geen '${controlKey}' variant in resultaten`)

  const rand = rng(seed)
  const wins = new Map<string, number>(results.map((r) => [r.variant, 0]))
  const beatsControl = new Map<string, number>(results.map((r) => [r.variant, 0]))

  for (let i = 0; i < draws; i++) {
    let best = ""
    let bestVal = -1
    let controlVal = 0
    const vals = results.map((r) => {
      const v = sampleBeta(1 + r.converted, 1 + Math.max(0, r.exposed - r.converted), rand)
      if (r.variant === controlKey) controlVal = v
      if (v > bestVal) {
        bestVal = v
        best = r.variant
      }
      return [r.variant, v] as const
    })
    wins.set(best, (wins.get(best) ?? 0) + 1)
    for (const [k, v] of vals) {
      if (v > controlVal) beatsControl.set(k, (beatsControl.get(k) ?? 0) + 1)
    }
  }

  const controlRate = control.exposed ? control.converted / control.exposed : 0
  return results.map((r) => {
    const rate = r.exposed ? r.converted / r.exposed : 0
    return {
      variant: r.variant,
      conversionRate: rate,
      controlRate,
      relativeLift: controlRate ? (rate - controlRate) / controlRate : 0,
      probabilityToBeBest: (wins.get(r.variant) ?? 0) / draws,
      probabilityBetterThanControl:
        r.variant === controlKey ? 0 : (beatsControl.get(r.variant) ?? 0) / draws,
      pValue:
        r.variant === controlKey
          ? 1
          : twoProportionPValue(control.converted, control.exposed, r.converted, r.exposed),
      revenuePerVisitor: r.exposed ? r.revenue / r.exposed : 0,
    }
  })
}

export type Decision =
  | { status: "winner"; variant: string; reason: string }
  | { status: "keep-control"; reason: string }
  | { status: "running"; reason: string }

export function decide(
  results: VariantResult[],
  comparisons: Comparison[],
  opts: { minExposuresPerVariant: number; minDays: number; winProbability: number; daysRunning: number }
): Decision {
  const minExposed = Math.min(...results.map((r) => r.exposed))
  if (opts.daysRunning < opts.minDays) {
    return {
      status: "running",
      reason: `Loopt ${opts.daysRunning} van minimaal ${opts.minDays} dagen (weekpatronen uitmiddelen).`,
    }
  }
  if (minExposed < opts.minExposuresPerVariant) {
    return {
      status: "running",
      reason: `Kleinste variant heeft ${minExposed} van minimaal ${opts.minExposuresPerVariant} bezoekers.`,
    }
  }
  const best = comparisons
    .filter((c) => c.variant !== "control")
    .sort((a, b) => b.probabilityBetterThanControl - a.probabilityBetterThanControl)[0]
  if (best && best.probabilityBetterThanControl >= opts.winProbability) {
    return {
      status: "winner",
      variant: best.variant,
      reason: `${pct(best.probabilityBetterThanControl)} kans dat '${best.variant}' beter is (lift ${signedPct(best.relativeLift)}).`,
    }
  }
  if (best && best.probabilityBetterThanControl <= 1 - opts.winProbability) {
    return {
      status: "keep-control",
      reason: `Control is met ${pct(1 - best.probabilityBetterThanControl)} zekerheid beter. Stop de test en houd control.`,
    }
  }
  return {
    status: "running",
    reason: `Nog geen duidelijke winnaar (beste variant: ${pct(best?.probabilityBetterThanControl ?? 0)} kans).`,
  }
}

export const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`
export const signedPct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`
