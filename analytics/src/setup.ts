/**
 * `npm run setup` — zet PostHog in één keer goed neer (idempotent, mag je vaker draaien):
 *   1. Dashboard "Webshop – Overzicht" met funnel, omzet, AOV, conversie en drop-off
 *   2. Een experiment (+ feature flag) per item in config.EXPERIMENTS, als draft
 *
 * Een draft-experiment doet nog niets. Start hem in PostHog (Experiments > Launch)
 * zodra je er klaar voor bent.
 */
import { DASHBOARD_NAME, EVENTS, EXPERIMENTS, FUNNEL, MANAGED_TAG } from "./config"
import { PostHogApi, envFromProcess } from "./posthog"

const ph = new PostHogApi(envFromProcess())

const series = (event: string, extra: Record<string, unknown> = {}) => ({
  kind: "EventsNode",
  event,
  name: event,
  ...extra,
})

type InsightDef = { name: string; description: string; source: Record<string, unknown> }

const INSIGHTS: InsightDef[] = [
  {
    name: "Funnel: product → winkelwagen → checkout → bestelling",
    description: "Waar haken bezoekers af? Conversievenster: 7 dagen.",
    source: {
      kind: "FunnelsQuery",
      series: FUNNEL.map((e) => series(e)),
      funnelsFilter: { funnelWindowInterval: 7, funnelWindowIntervalUnit: "day" },
      dateRange: { date_from: "-30d" },
    },
  },
  {
    name: "Omzet per dag",
    description: "Som van order_completed.revenue (server-side, incl. btw).",
    source: {
      kind: "TrendsQuery",
      series: [series(EVENTS.orderCompleted, { math: "sum", math_property: "revenue" })],
      interval: "day",
      dateRange: { date_from: "-30d" },
      trendsFilter: { display: "ActionsLineGraph" },
    },
  },
  {
    name: "Bestellingen per dag",
    description: "Aantal order_completed events.",
    source: {
      kind: "TrendsQuery",
      series: [series(EVENTS.orderCompleted)],
      interval: "day",
      dateRange: { date_from: "-30d" },
    },
  },
  {
    name: "Gemiddelde orderwaarde (AOV)",
    description: "Gemiddelde van order_completed.revenue per week.",
    source: {
      kind: "TrendsQuery",
      series: [series(EVENTS.orderCompleted, { math: "avg", math_property: "revenue" })],
      interval: "week",
      dateRange: { date_from: "-90d" },
    },
  },
  {
    name: "Conversie: bezoekers → bestelling",
    description: "Unieke bestellers / unieke bezoekers per week.",
    source: {
      kind: "TrendsQuery",
      series: [
        series(EVENTS.pageview, { math: "dau" }),
        series(EVENTS.orderCompleted, { math: "dau" }),
      ],
      interval: "week",
      dateRange: { date_from: "-90d" },
      trendsFilter: { formula: "B / A * 100", display: "ActionsLineGraph" },
    },
  },
  {
    name: "Bestellingen per land",
    description: "order_completed uitgesplitst op country.",
    source: {
      kind: "TrendsQuery",
      series: [series(EVENTS.orderCompleted)],
      breakdownFilter: { breakdown: "country", breakdown_type: "event" },
      dateRange: { date_from: "-30d" },
      trendsFilter: { display: "ActionsBarValue" },
    },
  },
]

async function ensureDashboard(): Promise<number> {
  const dashboards = await ph.listAll<{ id: number; name: string; deleted?: boolean }>("/dashboards/")
  const existing = dashboards.find((d) => d.name === DASHBOARD_NAME && !d.deleted)
  if (existing) {
    console.log(`✓ Dashboard bestaat al (#${existing.id})`)
    return existing.id
  }
  const created = await ph.request<{ id: number }>("POST", "/dashboards/", {
    name: DASHBOARD_NAME,
    description: "Aangemaakt door analytics/setup.ts — wordt bijgewerkt bij elke run.",
    tags: [MANAGED_TAG],
    pinned: true,
  })
  console.log(`+ Dashboard aangemaakt (#${created.id})`)
  return created.id
}

async function ensureInsights(dashboardId: number) {
  const insights = await ph.listAll<{ id: number; name: string; deleted?: boolean; tags?: string[] }>(
    "/insights/?saved=true"
  )
  for (const def of INSIGHTS) {
    const query = { kind: "InsightVizNode", source: def.source }
    const existing = insights.find((i) => i.name === def.name && !i.deleted)
    if (existing) {
      await ph.request("PATCH", `/insights/${existing.id}/`, {
        query,
        description: def.description,
        tags: [MANAGED_TAG],
      })
      console.log(`✓ Insight bijgewerkt: ${def.name}`)
    } else {
      await ph.request("POST", "/insights/", {
        name: def.name,
        description: def.description,
        query,
        saved: true,
        tags: [MANAGED_TAG],
        dashboards: [dashboardId],
      })
      console.log(`+ Insight aangemaakt: ${def.name}`)
    }
  }
}

async function ensureExperiments() {
  const experiments = await ph.listAll<{ id: number; feature_flag_key: string; archived?: boolean }>(
    "/experiments/"
  )
  for (const exp of EXPERIMENTS) {
    if (experiments.some((e) => e.feature_flag_key === exp.key && !e.archived)) {
      console.log(`✓ Experiment bestaat al: ${exp.key}`)
      continue
    }
    const split = Math.floor(100 / exp.variants.length)
    const created = await ph.request<{ id: number }>("POST", "/experiments/", {
      name: exp.name,
      description: `Hypothese: ${exp.hypothesis}`,
      feature_flag_key: exp.key,
      parameters: {
        feature_flag_variants: exp.variants.map((v, i) => ({
          key: v.key,
          name: v.name,
          split_percent: i === 0 ? 100 - split * (exp.variants.length - 1) : split,
        })),
      },
    })
    console.log(`+ Experiment aangemaakt (draft): ${exp.key} (#${created.id})`)

    // Primaire metric: bestelling geplaatst. Metrics-API verandert soms; faalt
    // dit, dan voeg je de metric met 2 klikken toe in de PostHog UI.
    try {
      await ph.request("PATCH", `/experiments/${created.id}/`, {
        metrics: [
          {
            kind: "ExperimentMetric",
            name: "Bestelling geplaatst",
            metric_type: "funnel",
            series: [{ kind: "EventsNode", event: EVENTS.orderCompleted }],
          },
        ],
      })
      console.log(`  ↳ metric 'order_completed' toegevoegd`)
    } catch (e) {
      console.warn(
        `  ↳ metric niet automatisch toegevoegd (${(e as Error).message.slice(0, 120)}…). ` +
          `Voeg in PostHog een funnel-metric op '${EVENTS.orderCompleted}' toe.`
      )
    }
  }
}

async function main() {
  console.log("PostHog inrichten…")
  const dashboardId = await ensureDashboard()
  await ensureInsights(dashboardId)
  await ensureExperiments()
  console.log("\nKlaar. Vergeet niet: Settings > Project > 'Cookieless server hash mode' aan te zetten.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
