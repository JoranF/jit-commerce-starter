import { createHash } from "node:crypto"
import { buildPurchaseEvent, hasMarketingConsent, purchaseEventId } from "../meta-capi"

const sha = (s: string) => createHash("sha256").update(s).digest("hex")

const order = {
  id: "order_01ABC",
  email: "  Jan@Example.NL ",
  currency_code: "eur",
  total: 123.95,
  created_at: "2026-11-21T10:00:00Z",
  items: [{ product_id: "prod_1", variant_id: "var_1", quantity: 1, unit_price: 119 }],
  shipping_address: {
    first_name: "Jan",
    last_name: "de Vries",
    phone: "+31 6 1234 5678",
    city: "Den Haag",
    postal_code: "2511 AB",
    country_code: "NL",
  },
  cartMetadata: {
    meta_consent: true,
    meta_fbp: "fb.1.123.456",
    meta_ip: "1.2.3.4",
    meta_ua: "Mozilla/5.0",
    meta_source_url: "https://lichtval.joranit.com/nl/checkout",
    ph_distinct_id: "visitor-1",
  },
}

describe("meta-capi", () => {
  it("bouwt een Purchase met hetzelfde event_id als de pixel", () => {
    const e = buildPurchaseEvent(order)
    expect(e.event_name).toBe("Purchase")
    expect(e.event_id).toBe(purchaseEventId(order.id))
    expect(e.event_id).toBe("order_order_01ABC")
    expect(e.event_time).toBe(Date.parse("2026-11-21T10:00:00Z") / 1000)
    expect(e.custom_data).toMatchObject({ currency: "EUR", value: 123.95, num_items: 1, content_ids: ["prod_1"] })
  })

  it("normaliseert en hasht persoonsgegevens", () => {
    const u = buildPurchaseEvent(order).user_data as Record<string, unknown>
    expect(u.em).toEqual([sha("jan@example.nl")])
    expect(u.ph).toEqual([sha("31612345678")])
    expect(u.ln).toEqual([sha("devries")])
    expect(u.ct).toEqual([sha("denhaag")])
    expect(u.zp).toEqual([sha("2511ab")])
    expect(u.country).toEqual([sha("nl")])
    expect(u.fbp).toBe("fb.1.123.456")
    expect(u.client_ip_address).toBe("1.2.3.4")
    expect(u).not.toHaveProperty("fbc")
  })

  it("stuurt alleen met toestemming", () => {
    expect(hasMarketingConsent(order.cartMetadata)).toBe(true)
    expect(hasMarketingConsent({ meta_consent: false })).toBe(false)
    expect(hasMarketingConsent(undefined)).toBe(false)
  })
})

import { buildFunnelEvent } from "../meta-capi"

describe("meta-capi funnel events", () => {
  const req = { ip: "1.2.3.4", ua: "UA" }
  it("neemt alleen toegestane velden over en gebruikt ip/ua van het verzoek", () => {
    const e = buildFunnelEvent(
      {
        event: "AddToCart",
        event_id: "abc",
        url: "https://x.nl/nl/products/lamp",
        params: { value: 129, currency: "eur", content_ids: ["prod_1"], content_type: "product", evil: "x" },
        fbp: "fb.1.1700000000000.123456",
        fbc: "fb.1.1700000000000.AbCdEf123",
      },
      req,
      1_700_000_000_000
    )!
    expect(e.event_name).toBe("AddToCart")
    expect(e.event_time).toBe(1_700_000_000)
    expect(e.custom_data).toEqual({ value: 129, currency: "EUR", content_ids: ["prod_1"], content_type: "product" })
    expect(e.user_data).toMatchObject({ fbp: "fb.1.1700000000000.123456", client_ip_address: "1.2.3.4", client_user_agent: "UA" })
  })
  it("weigert onbekende events en slechte cookies", () => {
    expect(buildFunnelEvent({ event: "Purchase", event_id: "a" }, req)).toBeNull()
    expect(buildFunnelEvent({ event: "ViewContent", event_id: "" }, req)).toBeNull()
    const e = buildFunnelEvent({ event: "ViewContent", event_id: "a", fbp: "rommel", fbc: "<script>" }, req)!
    expect(e.user_data).not.toHaveProperty("fbp")
    expect(e.user_data).not.toHaveProperty("fbc")
  })
})
