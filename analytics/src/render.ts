import type { ExperimentEvaluation } from "./evaluate"
import { eur, int, table } from "./notify"
import { pct, signedPct } from "./stats"

export function renderExperiment(e: ExperimentEvaluation) {
  const icon =
    e.decision.status === "winner" ? "🏆" : e.decision.status === "keep-control" ? "🛑" : "⏳"
  const lines = [
    `### ${icon} ${e.config.name} \`${e.config.key}\``,
    `_${e.config.hypothesis}_`,
    "",
    `Status: **${e.status}** · ${e.daysRunning} dagen · ${e.decision.reason}`,
  ]
  if (e.comparisons.length) {
    lines.push(
      "",
      table(
        ["Variant", "Bezoekers", "Bestellingen", "Conversie", "Lift", "Kans beter", "p-waarde", "Omzet/bezoeker"],
        e.comparisons.map((c) => {
          const r = e.results.find((x) => x.variant === c.variant)!
          const isControl = c.variant === "control"
          return [
            c.variant,
            int(r.exposed),
            int(r.converted),
            pct(c.conversionRate, 2),
            isControl ? "–" : signedPct(c.relativeLift),
            isControl ? "–" : pct(c.probabilityBetterThanControl),
            isControl ? "–" : c.pValue.toFixed(3),
            eur(c.revenuePerVisitor),
          ]
        })
      )
    )
  }
  return lines.join("\n")
}

