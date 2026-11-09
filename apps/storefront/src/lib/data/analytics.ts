"use server"

import { sdk } from "@lib/config"
import { getFeatureProperties, getVisitorId } from "@lib/analytics/server"
import { getAuthHeaders, getCartId } from "./cookies"

/**
 * Koppelt de bezoeker (en zijn experiment-varianten) aan de winkelwagen, vlak
 * voordat er betaald wordt. De backend leest dit uit bij `order.placed` en stuurt
 * `order_completed` naar PostHog met dezelfde distinct_id, zodat omzet aan de
 * juiste A/B-variant wordt toegeschreven.
 *
 * Faalt nooit hard: analytics mag de checkout niet blokkeren.
 */
export async function attachAnalyticsToCart(cartId?: string) {
  try {
    const id = cartId || (await getCartId())
    const distinctId = await getVisitorId()
    if (!id || !distinctId) return

    const { cart } = await sdk.store.cart.retrieve(
      id,
      { fields: "id,metadata" },
      await getAuthHeaders()
    )

    const features = await getFeatureProperties(distinctId)

    await sdk.store.cart.update(
      id,
      {
        metadata: {
          ...(cart.metadata ?? {}),
          ph_distinct_id: distinctId,
          ...features,
        },
      },
      {},
      await getAuthHeaders()
    )
  } catch (e) {
    console.warn("[analytics] kon bezoeker niet aan cart koppelen", e)
  }
}
