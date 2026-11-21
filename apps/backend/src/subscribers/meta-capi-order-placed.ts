import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { buildPurchaseEvent, hasMarketingConsent } from "../lib/meta-capi"

/**
 * Stuurt elke bestelling als `Purchase` naar Meta via de Conversions API.
 * Browsers missen 10–30% van de aankopen (adblockers, iOS); de server niet.
 * De pixel op de bedankpagina gebruikt hetzelfde event_id, dus Meta telt hem één keer.
 *
 * Alleen actief met META_PIXEL_ID + META_CAPI_TOKEN, en alleen voor klanten die
 * in de cookiebanner op "Accepteren" klikten (cart.metadata.meta_consent).
 * Test zonder echte advertenties: zet META_TEST_EVENT_CODE (Events Manager → Test events).
 */
export default async function metaCapiOrderPlaced({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const pixelId = process.env.META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN
  if (!pixelId || !token) return

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "email",
        "currency_code",
        "total",
        "created_at",
        "items.*",
        "shipping_methods.*",
        "shipping_address.*",
        "cart.metadata",
      ],
      filters: { id: data.id },
    })
    if (!order) return

    const cartMetadata = ((order as any).cart?.metadata ?? null) as Record<string, unknown> | null
    if (!hasMarketingConsent(cartMetadata)) return

    const event = buildPurchaseEvent(
      { ...(order as any), cartMetadata },
      { storeUrl: process.env.STORE_CORS?.split(",")[0] }
    )
    const version = process.env.META_GRAPH_VERSION || "v24.0"
    const body: Record<string, unknown> = { data: [event] }
    if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE

    const res = await fetch(
      `https://graph.facebook.com/${version}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    )
    if (!res.ok) {
      logger.warn(`[meta-capi] Purchase ${order.id} geweigerd: ${res.status} ${(await res.text()).slice(0, 300)}`)
      return
    }
    logger.info(`[meta-capi] Purchase ${order.id} verstuurd`)
  } catch (e) {
    // Mag nooit een bestelling blokkeren.
    logger.warn(`[meta-capi] mislukt: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
