/**
 * `npm run report` — wekelijks rapport (standaard: afgelopen 7 dagen vs. de week ervoor).
 *
 *  - KPI's: bezoekers, bestellingen, omzet, AOV, conversie (met week-op-week verschil)
 *  - Funnel met drop-off per stap → waar lekt de winkel?
 *  - Checkout per stap (adres, verzending, betaalmethode, controleren) + foutmeldingen
 *  - Top-producten: bekeken vs. gekocht (hoog bekeken + laag gekocht = kans!)
 *  - Status van alle A/B-tests
 *  - Optioneel: 3 test-ideeën van Claude (ANTHROPIC_API_KEY)
 *
 * Gebruik: npm run report -- --days 7
 */
import { suggestExperiments } from "./ai"
import { evaluateAll } from "./evaluate"
import { renderExperiment } from "./render"
import { delta, eur, int, publish, table } from "./notify"
import { PostHogApi, envFromProcess } from "./posthog"
import {
  getCheckoutErrors,
  getCheckoutSteps,
  getKpis,
  getTopProducts,
  type CheckoutErrorRow,
  type CheckoutStepRow,
  type Kpis,
} from "./queries"
import { pct } from "./stats"

function arg(name: string, fallback: number) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? Number(process.argv[i + 1]) : fallback
}

export function renderKpis(curr: Kpis, prev: Kpis) {
  return table(
    ["Metric", "Deze periode", "Vorige periode", "Verschil"],
    [
      ["Bezoekers", int(curr.visitors), int(prev.visitors), delta(curr.visitors, prev.visitors)],
      ["Bestellingen", int(curr.orders), int(prev.orders), delta(curr.orders, prev.orders)],
      ["Omzet (incl. btw)", eur(curr.revenue), eur(prev.revenue), delta(curr.revenue, prev.revenue)],
      ["Gem. orderwaarde", eur(curr.aov), eur(prev.aov), delta(curr.aov, prev.aov)],
      [
        "Conversie",
        pct(curr.conversionRate, 2),
        pct(prev.conversionRate, 2),
        delta(curr.conversionRate, prev.conversionRate),
      ],
    ]
  )
}

export function renderFunnel(k: Kpis) {
  const steps: [string, number][] = [
    ["Bezoekers", k.visitors],
    ["Product bekeken", k.productViewers],
    ["In winkelwagen", k.addToCart],
    ["Checkout gestart", k.checkouts],
    ["Besteld", k.orders],
  ]
  const rows = steps.map(([label, value], i) => {
    const prev = i === 0 ? value : steps[i - 1][1]
    const stepRate = i === 0 ? "–" : prev ? pct(value / prev) : "–"
    return [label, int(value), stepRate]
  })
  // Grootste lek = laagste stap-conversie (exclusief eerste stap)
  let worst = { label: "", rate: 1 }
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1][1]
    if (prev > 0) {
      const rate = steps[i][1] / prev
      if (rate < worst.rate) worst = { label: `${steps[i - 1][0]} → ${steps[i][0]}`, rate }
    }
  }
  return [
    table(["Stap", "Unieke bezoekers", "Door van vorige stap"], rows),
    worst.label ? `\n**Grootste lek:** ${worst.label} (${pct(worst.rate)} gaat door). Begin je volgende test hier.` : "",
  ].join("\n")
}

/**
 * Per checkout-stap: gezien → afgerond. De stap met het laagste percentage is
 * waar klanten vastlopen; samen met de foutmeldingen zie je meestal ook waarom.
 */
export function renderCheckoutSteps(steps: CheckoutStepRow[], errors: CheckoutErrorRow[]) {
  if (!steps.some((s) => s.viewed > 0)) return "_Nog geen checkout-data._"
  let worst: CheckoutStepRow | null = null
  for (const s of steps) {
    if (s.viewed < 5) continue // te weinig om iets over te zeggen
    if (!worst || s.completed / s.viewed < worst.completed / worst.viewed) worst = s
  }
  const lines = [
    table(
      ["Stap", "Gezien", "Afgerond", "Door"],
      steps.map((s) => [s.label, int(s.viewed), int(s.completed), s.viewed ? pct(s.completed / s.viewed) : "–"])
    ),
  ]
  if (worst) {
    lines.push(
      `\n**Hier lopen klanten vast:** ${worst.label} (${pct(worst.completed / worst.viewed)} rondt af). ` +
        `Bekijk sessie-opnames in PostHog (Replay → filter op checkout_step_viewed, step = ${worst.step}).`
    )
  }
  if (errors.length) {
    lines.push(
      "\n**Meest getoonde foutmeldingen**",
      table(["Stap", "Melding", "Bezoekers"], errors.map((e) => [e.step, e.error, int(e.visitors)]))
    )
  }
  return lines.join("\n")
}

async function main() {
  const days = arg("days", 7)
  const ph = new PostHogApi(envFromProcess())

  const [curr, prev, products, experiments, steps, errors] = await Promise.all([
    getKpis(ph, days, 0),
    getKpis(ph, days * 2, days),
    getTopProducts(ph, days),
    evaluateAll(ph),
    getCheckoutSteps(ph, days),
    getCheckoutErrors(ph, days),
  ])

  const productTable = products.length
    ? table(
        ["Product", "Bekeken", "In winkelwagen", "Verkocht", "Omzet"],
        products.map((p) => [p.name, int(p.views), int(p.carts), int(p.units), eur(p.revenue)])
      )
    : "_Nog geen productdata._"

  const metrics = [
    `### Kerncijfers (laatste ${days} dagen)`,
    renderKpis(curr, prev),
    "",
    "### Funnel",
    renderFunnel(curr),
    "",
    "### Checkout per stap",
    renderCheckoutSteps(steps, errors),
    "",
    "### Top-producten",
    productTable,
  ].join("\n")

  const ai = await suggestExperiments(metrics)

  const md = [
    `## 📊 Webshop-rapport — ${new Date().toLocaleDateString("nl-NL")}`,
    "",
    metrics,
    "",
    "### A/B-tests",
    ...experiments.map(renderExperiment).flatMap((s) => [s, ""]),
    ai ? `### 💡 Test-ideeën voor volgende week (AI)\n${ai}` : "",
  ].join("\n")

  console.log(md)
  await publish(`report-${new Date().toISOString().slice(0, 10)}`, md)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
