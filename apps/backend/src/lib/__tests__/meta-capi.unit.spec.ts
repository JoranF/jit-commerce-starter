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
