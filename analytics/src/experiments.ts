/**
 * `npm run experiments` — dagelijkse check van lopende A/B-tests.
 *
 * Per experiment: bezoekers, conversie, omzet per bezoeker, kans dat een variant
 * beter is, en een beslissing (winnaar / houd control / laat lopen).
 * Met AUTO_SHIP_WINNERS=true (en autoShip: true in config.ts) wordt een winnaar
 * automatisch naar 100% uitgerold en het experiment beëindigd.
 */
import { evaluateAll, shipWinner } from "./evaluate"
import { publish } from "./notify"
import { renderExperiment } from "./render"
import { PostHogApi, envFromProcess } from "./posthog"

async function main() {
  const ph = new PostHogApi(envFromProcess())
  const evaluations = await evaluateAll(ph)
  const autoShip = process.env.AUTO_SHIP_WINNERS === "true"

  const shipped: string[] = []
  for (const e of evaluations) {
    if (autoShip && e.config.autoShip && e.status === "running" && e.decision.status === "winner") {
      if (await shipWinner(ph, e)) shipped.push(`${e.config.key} → ${e.decision.variant}`)
    }
  }

  const md = [
    `## 🧪 A/B-tests — ${new Date().toLocaleDateString("nl-NL")}`,
    "",
    ...evaluations.map(renderExperiment).flatMap((s) => [s, ""]),
    shipped.length
      ? `**Automatisch uitgerold:** ${shipped.join(", ")}`
      : autoShip
        ? "_Auto-ship staat aan; geen winnaars om uit te rollen._"
        : "_Auto-ship staat uit (AUTO_SHIP_WINNERS=true om te activeren)._",
  ].join("\n")

  console.log(md)
  // Alleen naar de webhook als er iets te melden is (geen dagelijkse spam).
  const noteworthy = shipped.length > 0 || evaluations.some((e) => e.decision.status !== "running")
  if (noteworthy) await publish(`experiments-${new Date().toISOString().slice(0, 10)}`, md)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
