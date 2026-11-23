import { cartsToRemind, recoverUrl } from "../cart-reminder"
import { cartReminder } from "../emails/templates"

const now = new Date("2026-11-23T12:00:00Z")
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString()
const base = { id: "cart_1", email: "a@b.nl", items: [{}], metadata: { reminder_opt_in: true }, updated_at: hoursAgo(3) }

describe("cart reminder", () => {
  it("alleen met toestemming, e-mail, producten, niet afgerekend, 1–48 uur stil", () => {
    expect(cartsToRemind([base], now)).toHaveLength(1)
    expect(cartsToRemind([{ ...base, metadata: {} }], now)).toHaveLength(0)
    expect(cartsToRemind([{ ...base, metadata: { reminder_opt_in: "true" } }], now)).toHaveLength(0)
    expect(cartsToRemind([{ ...base, email: null }], now)).toHaveLength(0)
    expect(cartsToRemind([{ ...base, items: [] }], now)).toHaveLength(0)
    expect(cartsToRemind([{ ...base, completed_at: hoursAgo(2) }], now)).toHaveLength(0)
    expect(cartsToRemind([{ ...base, updated_at: hoursAgo(0.5) }], now)).toHaveLength(0)
    expect(cartsToRemind([{ ...base, updated_at: hoursAgo(50) }], now)).toHaveLength(0)
  })

  it("nooit twee keer", () => {
    expect(cartsToRemind([{ ...base, metadata: { reminder_opt_in: true, reminder_sent_at: hoursAgo(1) } }], now)).toHaveLength(0)
  })

  it("link en mail", () => {
    const url = recoverUrl("https://lichtval.nl", "cart_1", "BE")
    expect(url).toBe("https://lichtval.nl/be/herstel/cart_1")
    const brand = { name: "Lichtval", siteUrl: "https://lichtval.nl", colors: { dark: "#000", light: "#fff", accent: "#ccc" }, company: {} }
    const m = cartReminder(
      { id: "cart_1", currency_code: "eur", total: 134, items: [{ product_title: "Lichtval wandlamp", variant_title: "1 lamp", quantity: 1 }], shipping_address: { first_name: "Jan" } },
      brand,
      url
    )
    expect(m.subject).toContain("Lichtval")
    expect(m.text).toContain("Hoi Jan")
    expect(m.text).toContain(url)
    expect(m.text).toContain("1× Lichtval wandlamp (1 lamp)")
    expect(m.html).toContain(url)
    expect(m.text).not.toMatch(/korting|!/i)
  })
})
