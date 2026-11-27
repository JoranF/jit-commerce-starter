/**
 * End-to-end: ads.ts tegen een nep-Meta én nep-PostHog API.
 * Adviesmodus mag niets aanpassen; autopilot pauzeert en schaalt op.
 */
import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdtemp } from "node:fs/promises"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"
import { promisify } from "node:util"

const run = promisify(execFile)
const root = path.resolve(import.meta.dirname, "..")

function mockApis() {
  const calls: { method: string; url: string; body: string }[] = []
  const server = createServer(async (req, res) => {
    let raw = ""
    for await (const chunk of req) raw += chunk
    calls.push({ method: req.method!, url: req.url!, body: raw })
    const json = (d: unknown) => {
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify(d))
    }
    const url = new URL(req.url!, "http://x")
    // PostHog: omzet per advertentie
    if (url.pathname.includes("/query/")) {
      return json({ columns: ["ad_id", "orders", "revenue"], results: [["ad_win", 4, 536], ["ad_ok", 1, 134]] })
    }
    // Meta
    if (url.pathname.endsWith("/insights")) {
      return json({ data: [
        { ad_id: "ad_win", ad_name: "Winnaar", adset_id: "set_1", adset_name: "Set 1", campaign_name: "C", spend: "120", actions: [{ action_type: "purchase", value: "3" }, { action_type: "link_click", value: "200" }, { action_type: "add_to_cart", value: "12" }] },
        { ad_id: "ad_bad", ad_name: "Verliezer", adset_id: "set_1", adset_name: "Set 1", campaign_name: "C", spend: "130", actions: [{ action_type: "link_click", value: "150" }] },
        { ad_id: "ad_ok", ad_name: "Nieuw", adset_id: "set_2", adset_name: "Set 2", campaign_name: "C", spend: "20" },
      ] })
    }
    if (url.pathname.endsWith("/ads")) {
      return json({ data: [{ id: "ad_win", effective_status: "ACTIVE" }, { id: "ad_bad", effective_status: "ACTIVE" }, { id: "ad_ok", effective_status: "ACTIVE" }] })
    }
    if (req.method === "GET" && /set_\d$/.test(url.pathname)) {
      const id = url.pathname.split("/").pop()
      return json({ id, name: id === "set_1" ? "Set 1" : "Set 2", daily_budget: "2000", updated_time: "2026-01-01T00:00:00+0000" })
    }
    if (req.method === "POST") return json({ success: true })
    res.statusCode = 404
    res.end("{}")
  })
  return { server, calls }
}

test("ads: advies past niets aan, autopilot pauzeert verliezer en schaalt winnaar op", async () => {
  const { server, calls } = mockApis()
  await new Promise<void>((r) => server.listen(0, r))
  const base = `http://127.0.0.1:${(server.address() as any).port}`
  const cwd = await mkdtemp(path.join(tmpdir(), "jit-ads-"))
  const env = {
    ...process.env,
    POSTHOG_PERSONAL_API_KEY: "phx_test",
    POSTHOG_APP_HOST: base,
    META_GRAPH_HOST: base,
    META_ADS_TOKEN: "test",
    // Testwinkel met een advertentieaccount (via STORE_ID + override hieronder).
    STORE_ID: "lichtval",
    ADS_TEST_AD_ACCOUNT: "act_123",
    REPORT_WEBHOOK_URL: "",
    GITHUB_STEP_SUMMARY: "",
  }
  const tsx = path.join(root, "node_modules/.bin/tsx")
  try {
    const advice = await run(tsx, [path.join(root, "src/ads.ts")], { cwd, env })
    assert.match(advice.stdout, /Verliezer.*pauzeren/)
    assert.match(advice.stdout, /Set 1: €\s?20,00 → €\s?24,00/)
    assert.match(advice.stdout, /Adviesmodus/)
    const metaPost = (c: { method: string; url: string }) => c.method === "POST" && !c.url.includes("/query/")
    assert.ok(!calls.some(metaPost), "adviesmodus past niets aan bij Meta")

    await run(tsx, [path.join(root, "src/ads.ts")], { cwd, env: { ...env, ADS_AUTOPILOT: "true" } })
    const posts = calls.filter(metaPost)
    assert.ok(posts.some((c) => c.url.includes("ad_bad") && c.body.includes("status=PAUSED")))
    assert.ok(posts.some((c) => c.url.includes("set_1") && c.body.includes("daily_budget=2400")))
    assert.ok(!posts.some((c) => c.url.includes("ad_win") || c.url.includes("ad_ok")))
  } finally {
    server.close()
  }
})
