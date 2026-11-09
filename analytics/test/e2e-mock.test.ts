/**
 * End-to-end: draait report.ts en experiments.ts tegen een nep-PostHog API
 * (lokale HTTP-server), zodat de volledige pipeline getest is zonder account.
 */
import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdtemp, readFile, readdir } from "node:fs/promises"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"
import { promisify } from "node:util"

const run = promisify(execFile)
const root = path.resolve(import.meta.dirname, "..")

function mockPostHog() {
  const calls: { method: string; url: string; body: any }[] = []
  const start = new Date(Date.now() - 20 * 86_400_000).toISOString()
  const server = createServer(async (req, res) => {
    let raw = ""
    for await (const chunk of req) raw += chunk
    const body = raw ? JSON.parse(raw) : undefined
    calls.push({ method: req.method!, url: req.url!, body })
    const json = (data: unknown) => {
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify(data))
    }
    if (req.url!.includes("/experiments/") && req.method === "GET") {
      if (/experiments\/\d+\//.test(req.url!)) {
        return json({ id: 7, feature_flag_key: "pdp-cta-text", start_date: start, end_date: null,
          feature_flag: { id: 70, filters: { multivariate: { variants: [
            { key: "control", rollout_percentage: 50 }, { key: "test", rollout_percentage: 50 }] } } } })
      }
      return json({ next: null, results: [{ id: 7, feature_flag_key: "pdp-cta-text", start_date: start, end_date: null }] })
    }
    if (req.url!.includes("/query/")) {
      const q: string = body.query.query
      if (q.includes("$feature_flag_called")) {
        return json({ columns: ["variant", "exposed", "converted", "revenue", "first_exposure"], results: [
          ["control", 1500, 30, 1650, start], ["test", 1500, 58, 3300, start]] })
      }
      if (q.includes("ARRAY JOIN")) {
        return json({ columns: ["name", "views", "carts", "units", "revenue"], results: [
          ["Medusa T-Shirt", 900, 120, 40, 998], ["Sweatpants", 400, 20, 2, 59.9]] })
      }
      const isCurrent = q.includes("INTERVAL 7 DAY AND timestamp < now() - INTERVAL 0 DAY")
      return json({ columns: ["visitors", "product_viewers", "add_to_cart", "checkouts", "orders", "revenue"],
        results: [isCurrent ? [3000, 1800, 260, 140, 88, 4950] : [2600, 1500, 200, 120, 70, 3800]] })
    }
    if (req.method === "PATCH") return json({ ok: true })
    res.statusCode = 404
    res.end("{}")
  })
  return { server, calls }
}

test("report + experiments draaien volledig tegen nep-PostHog", async () => {
  const { server, calls } = mockPostHog()
  await new Promise<void>((r) => server.listen(0, r))
  const port = (server.address() as any).port
  const cwd = await mkdtemp(path.join(tmpdir(), "jit-analytics-"))
  const env = {
    ...process.env,
    POSTHOG_PERSONAL_API_KEY: "phx_test",
    POSTHOG_PROJECT_ID: "1",
    POSTHOG_APP_HOST: `http://127.0.0.1:${port}`,
    ANTHROPIC_API_KEY: "",
    REPORT_WEBHOOK_URL: "",
    GITHUB_STEP_SUMMARY: "",
  }
  const tsx = path.join(root, "node_modules/.bin/tsx")
  try {
    const report = await run(tsx, [path.join(root, "src/report.ts")], { cwd, env })
    assert.match(report.stdout, /Webshop-rapport/)
    assert.match(report.stdout, /Grootste lek:/)
    assert.match(report.stdout, /Medusa T-Shirt/)
    assert.match(report.stdout, /🏆/) // test-variant wint duidelijk na 20 dagen
    const files = await readdir(path.join(cwd, "reports"))
    assert.ok(files.some((f) => f.startsWith("report-")))
    const saved = await readFile(path.join(cwd, "reports", files[0]), "utf8")
    assert.match(saved, /Omzet \(incl\. btw\)/)

    // Auto-ship uit in config (autoShip: false) → geen PATCH op de flag
    await run(tsx, [path.join(root, "src/experiments.ts")], { cwd, env: { ...env, AUTO_SHIP_WINNERS: "true" } })
    assert.ok(!calls.some((c) => c.method === "PATCH" && c.url.includes("/feature_flags/")))
  } finally {
    server.close()
  }
})
