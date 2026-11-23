import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { buildFunnelEvent, type FunnelEventInput } from "../../../lib/meta-capi"

/**
 * POST /store/meta-event: de storefront stuurt hier ViewContent, AddToCart, InitiateCheckout en
 * AddPaymentInfo heen (na toestemming voor cookies), met hetzelfde event_id als de pixel. Wij
 * sturen ze door naar Meta's Conversions API. Zo ziet Meta ook de bovenste funnel als de browser
 * (adblocker, iOS) de pixel blokkeert, en kan er op die events geoptimaliseerd worden.
 * Zonder META_PIXEL_ID + META_CAPI_TOKEN doet dit niets. Altijd 204: nooit een fout naar de klant.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pixelId = process.env.META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN
  if (!pixelId || !token) return res.status(204).end()

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const fwd = req.headers["x-forwarded-for"]
    const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim() || req.socket?.remoteAddress || undefined
    const event = buildFunnelEvent(req.body as FunnelEventInput, { ip, ua: req.headers["user-agent"] })
    if (!event) return res.status(204).end()

    const body: Record<string, unknown> = { data: [event] }
    if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE
    const version = process.env.META_GRAPH_VERSION || "v24.0"
    const r = await fetch(`https://graph.facebook.com/${version}/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!r.ok) logger.warn(`[meta-capi] ${event.event_name} geweigerd: ${r.status} ${(await r.text()).slice(0, 200)}`)
  } catch (e) {
    logger.warn(`[meta-capi] funnel-event mislukt: ${(e as Error).message}`)
  }
  return res.status(204).end()
}
