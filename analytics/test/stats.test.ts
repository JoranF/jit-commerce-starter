import assert from "node:assert/strict"
import { test } from "node:test"
import { compareVariants, decide, normalCdf, twoProportionPValue } from "../src/stats"

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
