import assert from "node:assert/strict"
import { test } from "node:test"
import { DEFAULT_TEST_PLAN, decideAds, decideAdsets, testPhaseVerdict, type AdStats } from "../src/ads-rules"

const rules = { breakEvenCpa: 50, maxDailyBudget: 40, scaleStep: 0.2, now: new Date("2026-11-22T12:00:00Z") }
const ad = (p: Partial<AdStats>): AdStats => ({
  adId: "a", adName: "A", adsetId: "s1", adsetName: "Set 1", campaignName: "C",
  status: "ACTIVE", spend: 0, orders: 0, revenue: 0, metaPurchases: 0, ...p,
})

test("pauzeert na 2× break-even zonder bestelling, maar niet de laatste in de set", () => {
  const out = decideAds(
    [ad({ adId: "bad", spend: 120 }), ad({ adId: "ok", spend: 60, orders: 2 })],
    rules
  )
  assert.equal(out.find((d) => d.ad.adId === "bad")?.action, "pause")
  assert.equal(out.find((d) => d.ad.adId === "ok")?.action, "keep")

  const alone = decideAds([ad({ adId: "bad", spend: 120 })], rules)
  assert.equal(alone[0].action, "keep")
  assert.match(alone[0].reason, /laatste actieve/)
})

test("laat lopen bij te weinig uitgaven, ook zonder bestellingen", () => {
  const out = decideAds([ad({ adId: "x", spend: 90 }), ad({ adId: "y", spend: 10 })], rules)
  assert.ok(out.every((d) => d.action === "keep"))
})

test("pauzeert dure advertentie (CPA > 1,5× break-even na 3× break-even)", () => {
  const out = decideAds([ad({ adId: "duur", spend: 160, orders: 2 }), ad({ adId: "goed", spend: 50, orders: 2 })], rules)
  assert.equal(out.find((d) => d.ad.adId === "duur")?.action, "pause")
})

test("schaalt een goede set op met 20%, tot het maximum, en niet binnen 72 uur", () => {
  const ads = [ad({ adId: "w", spend: 90, orders: 3 })]
  const [d] = decideAdsets(ads, [{ id: "s1", name: "Set 1", dailyBudget: 20, updatedTime: "2026-11-10T00:00:00Z" }], rules)
  assert.equal(d.to, 24)
  const capped = decideAdsets(ads, [{ id: "s1", name: "Set 1", dailyBudget: 38, updatedTime: "2026-11-10T00:00:00Z" }], rules)
  assert.equal(capped[0].to, 40)
  const recent = decideAdsets(ads, [{ id: "s1", name: "Set 1", dailyBudget: 20, updatedTime: "2026-11-21T12:00:00Z" }], rules)
  assert.equal(recent.length, 0)
  const tooFew = decideAdsets([ad({ spend: 40, orders: 2 })], [{ id: "s1", name: "Set 1", dailyBudget: 20 }], rules)
  assert.equal(tooFew.length, 0)
})

test("pauzeert vroeg een advertentie die geen klikken trekt (CTR < 0,6%)", () => {
  const out = decideAds(
    [
      ad({ adId: "stil", spend: 35, impressions: 5000, linkClicks: 15 }),
      ad({ adId: "goed", spend: 35, impressions: 5000, linkClicks: 70 }),
    ],
    rules
  )
  assert.equal(out.find((d) => d.ad.adId === "stil")?.action, "pause")
  assert.match(out.find((d) => d.ad.adId === "stil")!.reason, /CTR/)
  assert.equal(out.find((d) => d.ad.adId === "goed")?.action, "keep")
})

test("CTR-regel wacht op genoeg vertoningen en uitgaven", () => {
  const out = decideAds(
    [ad({ adId: "a", spend: 35, impressions: 1500, linkClicks: 2 }), ad({ adId: "b", spend: 10, impressions: 5000, linkClicks: 5 })],
    rules
  )
  assert.ok(out.every((d) => d.action === "keep"))
})

test("testplan: te vroeg voor €150, stoppen bij dure klikken of geen winkelmand in stap A", () => {
  assert.equal(testPhaseVerdict([ad({ spend: 100, linkClicks: 50 })]).verdict, "loopt")
  const duur = testPhaseVerdict([ad({ spend: 160, linkClicks: 100, addToCarts: 5 })])
  assert.equal(duur.phase, "stap A")
  assert.equal(duur.verdict, "stoppen")
  assert.match(duur.reason, /CPC/)
  const leeg = testPhaseVerdict([ad({ spend: 160, linkClicks: 200, addToCarts: 0 })])
  assert.equal(leeg.verdict, "stoppen")
  assert.match(leeg.reason, /winkelmand/)
  assert.equal(testPhaseVerdict([ad({ spend: 160, linkClicks: 200, addToCarts: 4 })]).verdict, "loopt")
})

test("testplan stap B: doorgaan bij ≤ €55 per verkoop, stoppen bij > €70 en < 3% winkelmand", () => {
  assert.equal(testPhaseVerdict([ad({ spend: 300, linkClicks: 400, addToCarts: 20, orders: 6 })]).verdict, "doorgaan")
  assert.equal(testPhaseVerdict([ad({ spend: 320, linkClicks: 400, addToCarts: 8, orders: 2 })]).verdict, "stoppen")
  assert.equal(testPhaseVerdict([ad({ spend: 320, linkClicks: 400, addToCarts: 8, orders: 0 })]).verdict, "stoppen")
  // Veel winkelmandjes maar nog te duur: twijfel, niet meteen stoppen.
  assert.equal(testPhaseVerdict([ad({ spend: 320, linkClicks: 400, addToCarts: 30, orders: 4 })]).verdict, "twijfel")
  // Afwijkend plan per winkel.
  assert.equal(testPhaseVerdict([ad({ spend: 320, linkClicks: 400, addToCarts: 30, orders: 4 })], { ...DEFAULT_TEST_PLAN, continueCpa: 80 }).verdict, "doorgaan")
})
