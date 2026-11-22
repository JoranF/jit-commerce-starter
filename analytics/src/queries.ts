import { CHECKOUT_STEPS, EVENTS } from "./config"
import { PostHogApi, sqlString } from "./posthog"
import type { VariantResult } from "./stats"

export type Kpis = {
  visitors: number
  productViewers: number
  addToCart: number
  checkouts: number
  orders: number
  revenue: number
  aov: number
  conversionRate: number
}

const n = (v: unknown) => Number(v ?? 0) || 0

/** KPI's over een periode [daysAgoFrom, daysAgoTo) — bv. (7, 0) = afgelopen 7 dagen. */
export async function getKpis(ph: PostHogApi, daysAgoFrom: number, daysAgoTo: number): Promise<Kpis> {
  const window = `timestamp >= now() - INTERVAL ${daysAgoFrom} DAY AND timestamp < now() - INTERVAL ${daysAgoTo} DAY`
  const [row] = await ph.hogql(
    `SELECT
       uniqIf(distinct_id, event = ${sqlString(EVENTS.pageview)}) AS visitors,
       uniqIf(distinct_id, event = ${sqlString(EVENTS.productViewed)}) AS product_viewers,
       uniqIf(distinct_id, event = ${sqlString(EVENTS.productAddedToCart)}) AS add_to_cart,
       uniqIf(distinct_id, event = ${sqlString(EVENTS.checkoutStarted)}) AS checkouts,
       countIf(event = ${sqlString(EVENTS.orderCompleted)}) AS orders,
       sumIf(toFloat(properties.revenue), event = ${sqlString(EVENTS.orderCompleted)}) AS revenue
     FROM events
     WHERE ${window}`,
    "jit: kpis"
  )
  const visitors = n(row?.visitors)
  const orders = n(row?.orders)
  const revenue = n(row?.revenue)
  return {
    visitors,
    productViewers: n(row?.product_viewers),
    addToCart: n(row?.add_to_cart),
    checkouts: n(row?.checkouts),
    orders,
    revenue,
    aov: orders ? revenue / orders : 0,
    conversionRate: visitors ? orders / visitors : 0,
  }
}

export type ProductRow = { name: string; views: number; carts: number; units: number; revenue: number }

/** Top-producten: bekeken, in winkelwagen, verkocht (uit order_completed.products). */
export async function getTopProducts(ph: PostHogApi, days: number, limit = 10): Promise<ProductRow[]> {
  const rows = await ph.hogql(
    `WITH
       views AS (
         SELECT toString(properties.product_name) AS name,
                countIf(event = ${sqlString(EVENTS.productViewed)}) AS views,
                countIf(event = ${sqlString(EVENTS.productAddedToCart)}) AS carts
         FROM events
         WHERE event IN (${sqlString(EVENTS.productViewed)}, ${sqlString(EVENTS.productAddedToCart)})
           AND timestamp >= now() - INTERVAL ${days} DAY
         GROUP BY name
       ),
       sales AS (
         SELECT JSONExtractString(p, 'name') AS name,
                sum(JSONExtractFloat(p, 'quantity')) AS units,
                sum(JSONExtractFloat(p, 'quantity') * JSONExtractFloat(p, 'price')) AS revenue
         FROM events
         ARRAY JOIN JSONExtractArrayRaw(toString(properties.products)) AS p
         WHERE event = ${sqlString(EVENTS.orderCompleted)}
           AND timestamp >= now() - INTERVAL ${days} DAY
         GROUP BY name
       )
     SELECT coalesce(nullIf(views.name, ''), sales.name) AS name,
            views.views AS views, views.carts AS carts,
            sales.units AS units, sales.revenue AS revenue
     FROM views FULL OUTER JOIN sales ON views.name = sales.name
     ORDER BY revenue DESC, views DESC
     LIMIT ${limit}`,
    "jit: top products"
  )
  return rows.map((r) => ({
    name: String(r.name || "(onbekend)"),
    views: n(r.views),
    carts: n(r.carts),
    units: n(r.units),
    revenue: n(r.revenue),
  }))
}

/**
 * Experiment-resultaten op bezoekersniveau.
 * Blootstelling = eerste `$feature_flag_called` voor de flag (de variant die de
 * bezoeker zag). Conversie = `order_completed` van dezelfde distinct_id ná
 * blootstelling. Werkt omdat storefront en backend dezelfde distinct_id gebruiken.
 * Cookieless bezoekers (nog geen toestemming) hebben in de browser een andere ID
 * dan hun bestelling; die tellen niet mee, anders lijkt hun conversie 0%.
 */
export async function getExperimentResults(
  ph: PostHogApi,
  flag: string,
  sinceIso: string
): Promise<{ results: VariantResult[]; firstExposure: string | null }> {
  const rows = await ph.hogql(
    `WITH
       exposures AS (
         SELECT distinct_id,
                argMin(toString(properties.$feature_flag_response), timestamp) AS variant,
                min(timestamp) AS first_seen
         FROM events
         WHERE event = '$feature_flag_called'
           AND properties.$feature_flag = ${sqlString(flag)}
           AND coalesce(toString(properties.$cookieless_mode), '') != 'true'
           AND timestamp >= toDateTime(${sqlString(sinceIso)})
         GROUP BY distinct_id
       ),
       orders AS (
         SELECT distinct_id, timestamp, toFloat(properties.revenue) AS revenue
         FROM events
         WHERE event = ${sqlString(EVENTS.orderCompleted)}
           AND timestamp >= toDateTime(${sqlString(sinceIso)})
       ),
       per_visitor AS (
         SELECT e.distinct_id AS distinct_id, e.variant AS variant, e.first_seen AS first_seen,
                countIf(o.timestamp >= e.first_seen) AS n_orders,
                sumIf(o.revenue, o.timestamp >= e.first_seen) AS revenue
         FROM exposures e
         LEFT JOIN orders o ON o.distinct_id = e.distinct_id
         GROUP BY e.distinct_id, e.variant, e.first_seen
       )
     SELECT variant,
            count() AS exposed,
            countIf(n_orders > 0) AS converted,
            sum(revenue) AS revenue,
            min(first_seen) AS first_exposure
     FROM per_visitor
     WHERE variant NOT IN ('', 'false', 'null')
     GROUP BY variant
     ORDER BY variant`,
    `jit: experiment ${flag}`
  )
  const firstExposure = rows
    .map((r) => String(r.first_exposure ?? ""))
    .filter(Boolean)
    .sort()[0] ?? null
  return {
    results: rows.map((r) => ({
      variant: String(r.variant),
      exposed: n(r.exposed),
      converted: n(r.converted),
      revenue: n(r.revenue),
    })),
    firstExposure,
  }
}

export type CheckoutStepRow = { step: string; label: string; viewed: number; completed: number }

/**
 * Per checkout-stap: hoeveel unieke bezoekers zagen hem en hoeveel rondden hem af.
 * "Controleren" telt als afgerond bij payment_redirected (Mollie) of een bestelling.
 */
export async function getCheckoutSteps(ph: PostHogApi, days: number): Promise<CheckoutStepRow[]> {
  const [row] = await ph.hogql(
    `SELECT
       ${CHECKOUT_STEPS.map(
         (s) =>
           `uniqIf(distinct_id, event = ${sqlString(EVENTS.checkoutStepViewed)} AND properties.step = ${sqlString(s.key)}) AS viewed_${s.key},
       uniqIf(distinct_id, event = ${sqlString(EVENTS.checkoutStepCompleted)} AND properties.step = ${sqlString(s.key)}) AS completed_${s.key}`
       ).join(",\n       ")},
       uniqIf(distinct_id, event IN (${sqlString(EVENTS.paymentRedirected)}, ${sqlString(EVENTS.orderCompleted)})) AS submitted
     FROM events
     WHERE timestamp >= now() - INTERVAL ${days} DAY`,
    "jit: checkout steps"
  )
  return CHECKOUT_STEPS.map((s) => ({
    step: s.key,
    label: s.label,
    viewed: n(row?.[`viewed_${s.key}`]),
    completed: s.key === "review" ? n(row?.submitted) : n(row?.[`completed_${s.key}`]),
  }))
}

export type CheckoutErrorRow = { step: string; error: string; visitors: number }

/** Meest getoonde foutmeldingen in de checkout. */
export async function getCheckoutErrors(ph: PostHogApi, days: number, limit = 5): Promise<CheckoutErrorRow[]> {
  const rows = await ph.hogql(
    `SELECT toString(properties.step) AS step, toString(properties.error) AS error, uniq(distinct_id) AS visitors
     FROM events
     WHERE event = ${sqlString(EVENTS.checkoutError)}
       AND timestamp >= now() - INTERVAL ${days} DAY
     GROUP BY step, error
     ORDER BY visitors DESC
     LIMIT ${limit}`,
    "jit: checkout errors"
  )
  return rows.map((r) => ({ step: String(r.step || "?"), error: String(r.error || ""), visitors: n(r.visitors) }))
}

export type AdRevenueRow = { adId: string; orders: number; revenue: number }

/** Bestellingen en omzet per advertentie (order_completed.ad_ad), laatste `days` dagen. */
export async function getAdRevenue(ph: PostHogApi, days: number): Promise<AdRevenueRow[]> {
  const rows = await ph.hogql(
    `SELECT toString(properties.ad_ad) AS ad_id,
            count() AS orders,
            sum(toFloat(properties.revenue)) AS revenue
     FROM events
     WHERE event = ${sqlString(EVENTS.orderCompleted)}
       AND timestamp >= now() - INTERVAL ${days} DAY
       AND toString(properties.ad_ad) != ''
     GROUP BY ad_id`,
    "jit: revenue per ad"
  )
  return rows.map((r) => ({ adId: String(r.ad_id), orders: n(r.orders), revenue: n(r.revenue) }))
}
