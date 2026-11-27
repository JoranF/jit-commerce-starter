import assert from "node:assert/strict"
import { test } from "node:test"
import { compareVariants, decide, decideExperiment, normalCdf, twoProportionPValue } from "../src/stats"

test("normalCdf klopt op bekende punten", () => {
  assert.ok(Math.abs(normalCdf(0) - 0.5) < 1e-6)
  assert.ok(Math.abs(normalCdf(1.96) - 0.975) < 1e-3)
})

test("p-waarde: geen verschil → ~1, groot verschil → ~0", () => {
  assert.ok(twoProportionPValue(50, 1000, 50, 1000) > 0.99)
  assert.ok(twoProportionPValue(50, 1000, 100, 1000) < 0.001)
})

test("duidelijke winnaar: hoge kans + 'winner' beslissing", () => {
  const results = [
    { variant: "control", exposed: 2000, converted: 40, revenue: 2000 },
    { variant: "test", exposed: 2000, converted: 75, revenue: 3900 },
  ]
  const cmp = compareVariants(results)
  const t = cmp.find((c) => c.variant === "test")!
  assert.ok(t.probabilityBetterThanControl > 0.99, `kans was ${t.probabilityBetterThanControl}`)
  assert.ok(Math.abs(t.relativeLift - 0.875) < 1e-9)
  const d = decide(results, cmp, { minExposuresPerVariant: 500, minDays: 14, winProbability: 0.95, daysRunning: 15 })
  assert.equal(d.status, "winner")
})

test("te kort gelopen → blijft 'running', ook met groot verschil", () => {
  const results = [
    { variant: "control", exposed: 2000, converted: 40, revenue: 0 },
    { variant: "test", exposed: 2000, converted: 80, revenue: 0 },
  ]
  const d = decide(results, compareVariants(results), {
    minExposuresPerVariant: 500, minDays: 14, winProbability: 0.95, daysRunning: 3,
  })
  assert.equal(d.status, "running")
})

test("gelijke varianten → ~50% kans, geen winnaar", () => {
  const results = [
    { variant: "control", exposed: 3000, converted: 90, revenue: 0 },
    { variant: "test", exposed: 3000, converted: 90, revenue: 0 },
  ]
  const cmp = compareVariants(results)
  const p = cmp.find((c) => c.variant === "test")!.probabilityBetterThanControl
  assert.ok(p > 0.45 && p < 0.55, `kans was ${p}`)
  const d = decide(results, cmp, { minExposuresPerVariant: 500, minDays: 14, winProbability: 0.95, daysRunning: 20 })
  assert.equal(d.status, "running")
})

test("revenue_per_visitor: minder bestellingen maar hogere orderwaarde kan winnen", () => {
  // control: 30 × €134; test: 27 × €200 (meer sets) bij evenveel bezoekers
  const results = [
    { variant: "control", exposed: 1500, converted: 30, revenue: 30 * 134 },
    { variant: "test", exposed: 1500, converted: 27, revenue: 27 * 200 },
  ]
  const conv = compareVariants(results, "control", 20_000, 42, "conversion").find((c) => c.variant === "test")!
  const rev = compareVariants(results, "control", 20_000, 42, "revenue_per_visitor").find((c) => c.variant === "test")!
  assert.ok(conv.probabilityBetterThanControl < 0.5)
  assert.ok(rev.probabilityBetterThanControl > 0.8)
})

test("maxDays: geen winnaar na 28 dagen → control houden (inconclusive), wachtrij loopt door", () => {
  const results = [
    { variant: "control", exposed: 800, converted: 8, revenue: 0 },
    { variant: "test", exposed: 800, converted: 9, revenue: 0 },
  ]
  const opts = { minExposuresPerVariant: 500, minDays: 14, winProbability: 0.95, maxDays: 28 }
  assert.equal(decide(results, compareVariants(results), { ...opts, daysRunning: 20 }).status, "running")
  const d = decide(results, compareVariants(results), { ...opts, daysRunning: 28 })
  assert.equal(d.status, "keep-control")
  assert.equal(d.status === "keep-control" && d.conclusion, "inconclusive")
})

test("maxDays: te weinig verkeer na 28 dagen → ook stoppen", () => {
  const results = [
    { variant: "control", exposed: 200, converted: 2, revenue: 0 },
    { variant: "test", exposed: 210, converted: 3, revenue: 0 },
  ]
  const d = decide(results, compareVariants(results), {
    minExposuresPerVariant: 500, minDays: 14, winProbability: 0.95, maxDays: 28, daysRunning: 30,
  })
  assert.equal(d.status, "keep-control")
  assert.match(d.reason, /te weinig verkeer/)
})

test("add_to_cart: beslist op winkelmand, bestellingen als rem", () => {
  const base = { minExposuresPerVariant: 500, minDays: 14, winProbability: 0.95, maxDays: 28, metric: "add_to_cart" as const }
  // Duidelijk meer winkelmanden, bestellingen gelijk → winnaar
  const win = decideExperiment([
    { variant: "control", exposed: 1000, converted: 10, revenue: 0, added: 50 },
    { variant: "test", exposed: 1000, converted: 11, revenue: 0, added: 85 },
  ], { ...base, daysRunning: 15 })
  assert.equal(win.decision.status, "winner")
  // Meer winkelmanden, maar duidelijk minder bestellingen → niet uitrollen
  const rem = decideExperiment([
    { variant: "control", exposed: 1000, converted: 20, revenue: 0, added: 50 },
    { variant: "test", exposed: 1000, converted: 6, revenue: 0, added: 85 },
  ], { ...base, daysRunning: 15 })
  assert.equal(rem.decision.status, "running")
  assert.match(rem.decision.reason, /bestellingen lopen achter/)
})
