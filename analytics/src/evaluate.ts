import { EXPERIMENTS, type ExperimentConfig } from "./config"
import { PostHogApi } from "./posthog"
import { getExperimentResults } from "./queries"
import { compareVariants, decide, type Comparison, type Decision, type VariantResult } from "./stats"

export type ExperimentEvaluation = {
  config: ExperimentConfig
  posthogId?: number
  status: "draft" | "running" | "stopped" | "missing"
  daysRunning: number
  results: VariantResult[]
  comparisons: Comparison[]
  decision: Decision
}

type PhExperiment = {
  id: number
  feature_flag_key: string
  start_date: string | null
  end_date: string | null
  archived?: boolean
  feature_flag?: { id: number; filters?: any }
}

export async function evaluateAll(ph: PostHogApi): Promise<ExperimentEvaluation[]> {
  const phExperiments = await ph.listAll<PhExperiment>("/experiments/")
  const out: ExperimentEvaluation[] = []

  for (const config of EXPERIMENTS) {
    const exp = phExperiments.find((e) => e.feature_flag_key === config.key && !e.archived)
    if (!exp || !exp.start_date) {
      out.push({
        config,
        posthogId: exp?.id,
        status: exp ? "draft" : "missing",
        daysRunning: 0,
        results: [],
        comparisons: [],
        decision: {
          status: "running",
          reason: exp ? "Nog niet gestart (draft)." : "Bestaat niet in PostHog — draai `npm run setup`.",
        },
      })
      continue
    }

    const { results } = await getExperimentResults(ph, config.key, exp.start_date)
    const end = exp.end_date ? new Date(exp.end_date) : new Date()
    const daysRunning = Math.floor((end.getTime() - new Date(exp.start_date).getTime()) / 86_400_000)

    // Zorg dat elke variant in de resultaten staat (ook met 0 bezoekers).
    for (const v of config.variants) {
      if (!results.some((r) => r.variant === v.key)) {
        results.push({ variant: v.key, exposed: 0, converted: 0, revenue: 0 })
      }
    }

    const comparisons = compareVariants(results)
    const decision = decide(results, comparisons, {
      minExposuresPerVariant: config.minExposuresPerVariant,
      minDays: config.minDays,
      winProbability: config.winProbability,
      daysRunning,
    })

    out.push({
      config,
      posthogId: exp.id,
      status: exp.end_date ? "stopped" : "running",
      daysRunning,
      results,
      comparisons,
      decision,
    })
  }
  return out
}

/**
 * Rol de winnaar uit naar 100% en beëindig het experiment.
 * Alleen als config.autoShip én env AUTO_SHIP_WINNERS=true.
 */
export async function shipWinner(ph: PostHogApi, evaluation: ExperimentEvaluation) {
  if (evaluation.decision.status !== "winner" || !evaluation.posthogId) return false
  const winner = evaluation.decision.variant
  const exp = await ph.request<PhExperiment>("GET", `/experiments/${evaluation.posthogId}/`)
  const flag = exp.feature_flag
  if (!flag) throw new Error(`Experiment ${evaluation.config.key} heeft geen feature flag`)

  const filters = structuredClone(flag.filters ?? {})
  const variants: { key: string; rollout_percentage: number }[] = filters.multivariate?.variants ?? []
  if (!variants.some((v) => v.key === winner)) {
    throw new Error(`Variant '${winner}' niet gevonden in flag ${evaluation.config.key}`)
  }
  filters.multivariate.variants = variants.map((v) => ({
    ...v,
    rollout_percentage: v.key === winner ? 100 : 0,
  }))

  await ph.request("PATCH", `/feature_flags/${flag.id}/`, { filters })
  await ph.request("PATCH", `/experiments/${evaluation.posthogId}/`, {
    end_date: new Date().toISOString(),
    conclusion: "won",
    conclusion_comment: `Automatisch uitgerold door analytics/experiments.ts: ${evaluation.decision.reason}`,
  })
  return true
}
