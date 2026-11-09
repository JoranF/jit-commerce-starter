import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Stuurt bij elke geplaatste bestelling een server-side `order_completed` event
 * naar PostHog (via Medusa's Analytics Module).
 *
 * Waarom server-side? Browser-tracking mist ~10-30% door adblockers en mensen die
 * de bedankpagina niet zien. Dit event is de "bron van waarheid" voor omzet en
 * is de conversie-metric voor je A/B-experimenten.
 *
 * De storefront zet de PostHog distinct_id in cart.metadata.ph_distinct_id, zodat
 * dit event aan dezelfde bezoeker (en dus dezelfde experiment-variant) hangt.
 */
const money = (n: unknown) => Math.round(Number(n ?? 0) * 100) / 100

export default async function analyticsOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const analytics = container.resolve(Modules.ANALYTICS)

  try {
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "currency_code",
        "total",
        "subtotal",
        "item_total",
        "tax_total",
        "shipping_total",
        "discount_total",
        "customer_id",
        "customer.has_account",
        "metadata",
        // Volledige items + verzendmethodes zijn nodig zodat Medusa de totalen berekent.
        "items.*",
        "shipping_methods.*",
        "shipping_address.*",
        "promotions.code",
        "cart.metadata",
      ],
      filters: { id: data.id },
    })

    if (!order) {
      return
    }

    const cartMeta = ((order as any).cart?.metadata ?? {}) as Record<string, unknown>
    const orderMeta = (order.metadata ?? {}) as Record<string, unknown>
    const distinctId =
      (cartMeta.ph_distinct_id as string) ||
      (orderMeta.ph_distinct_id as string) ||
      order.customer_id ||
      `order_${order.id}`

    // Feature-flag varianten die de storefront meestuurde ($feature/<flag>),
    // zodat je omzet per variant ook buiten PostHog-experimenten kunt uitsplitsen.
    const featureProps = Object.fromEntries(
      Object.entries(cartMeta).filter(([k]) => k.startsWith("$feature/"))
    )

    await analytics.track({
      event: "order_completed",
      actor_id: distinctId,
      properties: {
        order_id: order.id,
        display_id: order.display_id,
        currency: order.currency_code,
        revenue: money(order.total),
        subtotal: money(order.subtotal),
        tax: money(order.tax_total),
        shipping: money(order.shipping_total),
        discount: money(order.discount_total),
        item_count: (order.items ?? []).reduce((n, i: any) => n + Number(i.quantity), 0),
        products: (order.items ?? []).map((i: any) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          sku: i.variant_sku,
          name: i.product_title,
          quantity: Number(i.quantity),
          price: money(i.unit_price),
        })),
        coupon_codes: ((order as any).promotions ?? [])
          .map((p: any) => p?.code)
          .filter(Boolean),
        country: order.shipping_address?.country_code,
        has_account: Boolean((order as any).customer?.has_account),
        source: "medusa-backend",
        ...featureProps,
      },
    })
  } catch (e) {
    // Analytics mag nooit een bestelling blokkeren.
    logger.warn(`[analytics] order_completed tracking mislukt: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
