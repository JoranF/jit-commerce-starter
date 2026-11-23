import { createHash } from "node:crypto"

/**
 * Meta Conversions API (server-side Purchase). Pure functies zodat ze te testen
 * zijn; de subscriber `meta-capi-order-placed.ts` doet de HTTP-call.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */
export type CapiOrder = {
  id: string
  email?: string | null
  currency_code: string
  total?: unknown
  created_at?: string | Date | null
  items?: { product_id?: string | null; variant_id?: string | null; quantity?: unknown; unit_price?: unknown }[] | null
  shipping_address?: {
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    city?: string | null
    postal_code?: string | null
    country_code?: string | null
  } | null
  /** cart.metadata, gezet door de storefront (attachAnalyticsToCart). */
  cartMetadata?: Record<string, unknown> | null
}

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex")

/** Normaliseren zoals Meta vraagt, daarna hashen. Leeg = weglaten. */
const hashed = (v: string | null | undefined, normalize: (s: string) => string) => {
  const n = v ? normalize(v) : ""
  return n ? [sha256(n)] : undefined
}
const lower = (s: string) => s.trim().toLowerCase()
const lettersOnly = (s: string) => lower(s).replace(/[^\p{L}]/gu, "")
const digitsOnly = (s: string) => s.replace(/\D/g, "")
const zip = (s: string) => lower(s).replace(/\s+/g, "")

/** Event-ID dat ook de pixel op de bedankpagina gebruikt → Meta ontdubbelt. */
export const purchaseEventId = (orderId: string) => `order_${orderId}`

/** Alleen sturen als de bezoeker cookies/marketing accepteerde in de banner. */
export const hasMarketingConsent = (meta?: Record<string, unknown> | null) =>
  meta?.meta_consent === true

export function buildPurchaseEvent(order: CapiOrder, opts: { storeUrl?: string } = {}) {
  const meta = order.cartMetadata ?? {}
  const a = order.shipping_address ?? {}
  const str = (k: string) => (typeof meta[k] === "string" ? (meta[k] as string) : undefined)
  const items = (order.items ?? []).map((i) => ({
    id: i.product_id || i.variant_id || "unknown",
    quantity: Number(i.quantity ?? 1),
    item_price: Math.round(Number(i.unit_price ?? 0) * 100) / 100,
  }))
  const created = order.created_at ? new Date(order.created_at).getTime() : Date.now()

  const user_data = Object.fromEntries(
    Object.entries({
      em: hashed(order.email, lower),
      ph: hashed(a.phone, digitsOnly),
      fn: hashed(a.first_name, lettersOnly),
      ln: hashed(a.last_name, lettersOnly),
      ct: hashed(a.city, lettersOnly),
      zp: hashed(a.postal_code, zip),
      country: hashed(a.country_code, lower),
      external_id: hashed(str("ph_distinct_id"), (s) => s.trim()),
      fbp: str("meta_fbp"),
      fbc: str("meta_fbc"),
      client_ip_address: str("meta_ip"),
      client_user_agent: str("meta_ua"),
    }).filter(([, v]) => v !== undefined)
  )

  return {
    event_name: "Purchase",
    event_time: Math.floor(created / 1000),
    event_id: purchaseEventId(order.id),
    action_source: "website",
    event_source_url: str("meta_source_url") || opts.storeUrl,
    user_data,
    custom_data: {
      currency: order.currency_code.toUpperCase(),
      value: Math.round(Number(order.total ?? 0) * 100) / 100,
      content_type: "product",
      content_ids: items.map((i) => i.id),
      contents: items,
      num_items: items.reduce((n, i) => n + i.quantity, 0),
      order_id: order.id,
    },
  }
}

/** Funnel-events die de storefront via /store/meta-event doorgeeft (Purchase gaat via de subscriber). */
export const FUNNEL_EVENTS = ["ViewContent", "AddToCart", "InitiateCheckout", "AddPaymentInfo"] as const
export type FunnelEventName = (typeof FUNNEL_EVENTS)[number]

export type FunnelEventInput = {
  event: string
  event_id: string
  url?: string
  params?: Record<string, unknown>
  fbp?: string
  fbc?: string
  email?: string
}

const FBP = /^fb\.\d\.\d{10,13}\.\d+$/
const FBC = /^fb\.\d\.\d{10,13}\.[\w-]{5,}$/

/**
 * Bouwt een funnel-event voor de Conversions API uit wat de browser stuurde. Alleen een vaste
 * lijst events en velden (de route is publiek: geen vrije invoer naar Meta). IP en user agent
 * komen van het verzoek zelf, dus het zijn die van de bezoeker.
 * Geeft null bij een ongeldig event.
 */
export function buildFunnelEvent(input: FunnelEventInput, req: { ip?: string; ua?: string }, now = Date.now()) {
  if (!(FUNNEL_EVENTS as readonly string[]).includes(input.event)) return null
  if (!input.event_id || typeof input.event_id !== "string" || input.event_id.length > 100) return null
  const p = input.params ?? {}
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : undefined)
  const str = (v: unknown, max = 200) => (typeof v === "string" && v ? v.slice(0, max) : undefined)
  const ids = Array.isArray(p.content_ids) ? p.content_ids.filter((x): x is string => typeof x === "string").slice(0, 20) : undefined

  const custom_data = Object.fromEntries(
    Object.entries({
      value: num(p.value),
      currency: typeof p.currency === "string" && /^[A-Za-z]{3}$/.test(p.currency) ? p.currency.toUpperCase() : undefined,
      content_ids: ids?.length ? ids : undefined,
      content_name: str(p.content_name),
      content_type: p.content_type === "product" ? "product" : undefined,
      num_items: num(p.num_items),
    }).filter(([, v]) => v !== undefined)
  )
  const user_data = Object.fromEntries(
    Object.entries({
      em: hashed(input.email, lower),
      fbp: input.fbp && FBP.test(input.fbp) ? input.fbp : undefined,
      fbc: input.fbc && FBC.test(input.fbc) ? input.fbc : undefined,
      client_ip_address: req.ip,
      client_user_agent: req.ua,
    }).filter(([, v]) => v !== undefined)
  )
  return {
    event_name: input.event,
    event_time: Math.floor(now / 1000),
    event_id: input.event_id,
    action_source: "website",
    event_source_url: str(input.url, 500),
    user_data,
    custom_data,
  }
}
