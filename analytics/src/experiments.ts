/**
 * `npm run experiments` — dagelijkse check van lopende A/B-tests.
 *
 * Per experiment: bezoekers, conversie, omzet per bezoeker, kans dat een variant
 * beter is, en een beslissing (winnaar / houd control / laat lopen).
 * Met AUTO_SHIP_WINNERS=true (en autoShip: true in config.ts) wordt een winnaar
 * automatisch naar 100% uitgerold en het experiment beëindigd.
 * Met AUTO_LAUNCH_EXPERIMENTS=true worden draft-experimenten (uit `npm run setup`)
 * automatisch gestart, zodat er altijd een test loopt zonder dat je iets hoeft te doen:
 * hooguit MAX_CONCURRENT_EXPERIMENTS tegelijk (standaard 1), in de volgorde van config.ts.
 */
import { concludeKeepControl, evaluateAll, launchExperiment, shipWinner } from "./evaluate"
import { publish } from "./notify"
import { renderExperiment } from "./render"
import { PostHogApi, envFromProcess } from "./posthog"

async function main() {
  const ph = new PostHogApi(envFromProcess())
  const evaluations = await evaluateAll(ph)
  const autoShip = process.env.AUTO_SHIP_WINNERS === "true"
  const autoLaunch = process.env.AUTO_LAUNCH_EXPERIMENTS === "true"

  // Eerst afronden (winnaar uitrollen, of control houden), dan pas de wachtrij aanvullen:
  // zo start de volgende test op dezelfde dag dat de vorige klaar is.
  const shipped: string[] = []
  const concluded: string[] = []
  for (const e of evaluations) {
    if (!(autoShip && e.config.autoShip && e.status === "running")) continue
    if (e.decision.status === "winner" && (await shipWinner(ph, e))) {
      shipped.push(`${e.config.key} → ${e.decision.variant}`)
      e.status = "stopped"
    } else if (e.decision.status === "keep-control" && (await concludeKeepControl(ph, e))) {
      concluded.push(e.config.key)
      e.status = "stopped"
    }
  }

  // Wachtrij: met weinig verkeer liefst één test tegelijk (MAX_CONCURRENT_EXPERIMENTS,
  // standaard 1). Volgorde in config.EXPERIMENTS = prioriteit.
  const maxConcurrent = Math.max(1, Number(process.env.MAX_CONCURRENT_EXPERIMENTS || 1))
  let running = evaluations.filter((e) => e.status === "running").length
  const launched: string[] = []
  if (autoLaunch) {
    for (const e of evaluations) {
      if (running >= maxConcurrent) break
      if (e.status === "draft" && e.posthogId && (await launchExperiment(ph, e.posthogId))) {
        launched.push(e.config.key)
        running++
      }
    }
  }

  const md = [
    `## 🧪 A/B-tests — ${new Date().toLocaleDateString("nl-NL")}`,
    "",
    ...evaluations.map(renderExperiment).flatMap((s) => [s, ""]),
    launched.length ? `**Automatisch gestart:** ${launched.join(", ")}\n` : "",
    concluded.length ? `**Gestopt, control blijft:** ${concluded.join(", ")}\n` : "",
    shipped.length
      ? `**Automatisch uitgerold:** ${shipped.join(", ")}`
      : autoShip
        ? "_Auto-ship staat aan; geen winnaars om uit te rollen._"
        : "_Auto-ship staat uit (AUTO_SHIP_WINNERS=true om te activeren)._",
  ].join("\n")

  console.log(md)
  // Alleen naar de webhook als er iets te melden is (geen dagelijkse spam).
  const noteworthy = shipped.length > 0 || concluded.length > 0 || launched.length > 0 || evaluations.some((e) => e.decision.status !== "running")
  if (noteworthy) await publish(`experiments-${new Date().toISOString().slice(0, 10)}`, md)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
