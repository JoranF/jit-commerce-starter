"use server"

import { cookies, headers } from "next/headers"
import { sdk } from "@lib/config"
import { CONSENT_COOKIE } from "@lib/analytics/constants"
import { AD_COOKIE, adProperties, decodeAdTouch } from "@lib/analytics/ad-touch"
import { getFeatureProperties, getVisitorId } from "@lib/analytics/server"
import { getAuthHeaders, getCartId } from "./cookies"

/**
 * Koppelt de bezoeker aan de winkelwagen, vlak voordat er betaald wordt. De
 * backend leest dit uit bij `order.placed`:
 * - PostHog: `order_completed` met dezelfde distinct_id en experiment-varianten,
 *   zodat omzet aan de juiste A/B-variant wordt toegeschreven.
 * - Advertentie (`ad_*`, uit de cookie `jit_ad`): omzet per advertentie.
 * - Meta Conversions API: alleen als de bezoeker cookies accepteerde
 *   (`meta_consent`), met _fbp/_fbc, user agent en IP voor de matching.
 *
 * Faalt nooit hard: analytics mag de checkout niet blokkeren.
 */
export async function attachAnalyticsToCart(cartId?: string) {
  try {
    const id = cartId || (await getCartId())
    if (!id) return
    const distinctId = await getVisitorId()
    const jar = await cookies()
    const h = await headers()
    const consent = jar.get(CONSENT_COOKIE)?.value === "granted"

    const { cart } = await sdk.store.cart.retrieve(
      id,
      { fields: "id,metadata" },
      await getAuthHeaders()
    )

    const features = distinctId ? await getFeatureProperties(distinctId) : {}
    // Met welke advertentie kwam deze klant binnen (ad_source, ad_campaign, ad_ad, …)?
    const ad = adProperties(decodeAdTouch(jar.get(AD_COOKIE)?.value))
    const meta = consent
      ? {
          meta_consent: true,
          meta_fbp: jar.get("_fbp")?.value,
          meta_fbc: jar.get("_fbc")?.value,
          meta_ua: h.get("user-agent") ?? undefined,
          meta_ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined,
          meta_source_url: h.get("referer") ?? undefined,
        }
      : { meta_consent: false }

    await sdk.store.cart.update(
      id,
      {
        metadata: {
          ...(cart.metadata ?? {}),
          ...(distinctId ? { ph_distinct_id: distinctId } : {}),
          ...features,
          ...ad,
          ...meta,
        },
      },
      {},
      await getAuthHeaders()
    )
  } catch (e) {
    console.warn("[analytics] kon bezoeker niet aan cart koppelen", e)
  }
}
