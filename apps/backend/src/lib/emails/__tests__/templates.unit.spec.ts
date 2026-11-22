import { addBusinessDays, deliveryWindow, esc } from "../format"
import { orderCanceled, orderConfirmation, orderShipped, ownerNewOrder, type Brand, type EmailOrder } from "../templates"
import { parseAddress } from "../../../modules/email/service"

const brand: Brand = {
  name: "Lichtval",
  siteUrl: "https://lichtval.nl",
  colors: { dark: "#16323A", light: "#EDEFEB", accent: "#F0CB86" },
  company: {
    legalName: "Joran Information Technology",
    kvk: "96539402",
    vat: "NL005215436B31",
    address: "Prins Bernhardstraat 8, 6668 AH Randwijk",
    email: "hallo@lichtval.nl",
  },
}

const order: EmailOrder = {
  id: "order_1",
  display_id: 1042,
  email: "sanne@example.nl",
  currency_code: "eur",
  // maandag 23 november 2026
  created_at: "2026-11-23T10:00:00Z",
  total: 133.95,
  shipping_total: 4.95,
  tax_total: 23.25,
  discount_total: 0,
  items: [{ product_title: "Lichtval wandlamp", variant_title: "1 lamp", quantity: 1, unit_price: 129, total: 129 }],
  shipping_address: {
    first_name: "Sanne",
    last_name: "de Vries",
    address_1: "Damrak 12a",
    postal_code: "1012 LG",
    city: "Amsterdam",
    country_code: "nl",
  },
}

const policy = { handling_days_min: 1, handling_days_max: 3, transit_days_min: 7, transit_days_max: 12, return_window_days: 14 }

describe("format", () => {
  it("skips weekends when adding business days", () => {
    // vrijdag 27 nov + 1 werkdag = maandag 30 nov
    expect(addBusinessDays(new Date("2026-11-27T10:00:00Z"), 1).toISOString().slice(0, 10)).toBe("2026-11-30")
  })

  it("gives a delivery window from the region policy", () => {
    // ma 23 nov + 8 werkdagen = do 3 dec; + 15 werkdagen = ma 14 dec
    expect(deliveryWindow(new Date("2026-11-23T10:00:00Z"), policy)).toBe(
      "tussen donderdag 3 december en maandag 14 december"
    )
    expect(deliveryWindow(new Date(), null)).toBeNull()
  })

  it("escapes HTML", () => {
    expect(esc(`<b>"x"</b>`)).toBe("&lt;b&gt;&quot;x&quot;&lt;/b&gt;")
  })
})

describe("orderConfirmation", () => {
  const mail = orderConfirmation(order, brand, { policy })

  it("has the order number, totals, VAT and delivery window", () => {
    expect(mail.subject).toBe("Je bestelling bij Lichtval (#1042)")
    expect(mail.text).toContain("1 × Lichtval wandlamp (1 lamp)")
    expect(mail.text).toMatch(/Totaal\s+€\s?133,95 \(incl\. €\s?23,25 btw\)/)
    expect(mail.text).toContain("tussen donderdag 3 december en maandag 14 december")
  })

  it("contains what the law requires: company details and withdrawal right with form", () => {
    for (const s of ["Joran Information Technology", "KvK 96539402", "Btw NL005215436B31", "Prins Bernhardstraat 8"]) {
      expect(mail.text).toContain(s)
      expect(mail.html).toContain(s)
    }
    expect(mail.text).toContain("14 dagen bedenktijd")
    expect(mail.html).toContain("https://lichtval.nl/nl/returns")
    expect(mail.html).toContain("modelformulier voor herroeping")
    expect(mail.html).toContain("https://lichtval.nl/nl/terms")
  })

  it("links to the order status page", () => {
    expect(mail.html).toContain("https://lichtval.nl/nl/order/order_1/status")
    expect(mail.text).toContain("Volg je bestelling: https://lichtval.nl/nl/order/order_1/status")
  })

  it("escapes customer input", () => {
    const evil = orderConfirmation(
      { ...order, shipping_address: { ...order.shipping_address, first_name: "<script>x</script>" } },
      brand,
      { policy }
    )
    expect(evil.html).not.toContain("<script>x</script>")
    expect(evil.html).toContain("&lt;script&gt;")
  })
})

describe("orderShipped", () => {
  it("links to the track & trace", () => {
    const mail = orderShipped(order, brand, {
      tracking: [{ number: "LP123456789CN", url: "https://t.17track.net/en#nums=LP123456789CN" }],
      policy,
      shippedAt: new Date("2026-11-25T10:00:00Z"),
    })
    expect(mail.subject).toBe("Je bestelling is onderweg (#1042)")
    // Hoofdknop naar de eigen statuspagina, vervoerder als extra link.
    expect(mail.text).toContain("Volg je pakket: https://lichtval.nl/nl/order/order_1/status")
    expect(mail.html).toContain("https://t.17track.net/en#nums=LP123456789CN")
    expect(mail.text).toContain("Trackingnummer: LP123456789CN")
    // wo 25 nov + 7..12 werkdagen
    expect(mail.text).toContain("tussen vrijdag 4 december en vrijdag 11 december")
  })
})

describe("address privacy", () => {
  it("only the confirmation (legally required) contains the street address", () => {
    const addr = "Prins Bernhardstraat 8"
    expect(orderConfirmation(order, brand, { policy }).text).toContain(addr)
    const shipped = orderShipped(order, brand, { tracking: [], policy })
    expect(shipped.html).not.toContain(addr)
    expect(shipped.text).not.toContain(addr)
    expect(orderCanceled(order, brand).html).not.toContain(addr)
  })
})

describe("other mails", () => {
  it("cancellation", () => {
    expect(orderCanceled(order, brand).subject).toBe("Je bestelling is geannuleerd (#1042)")
  })

  it("owner notification mentions the ad and CJ payment", () => {
    const mail = ownerNewOrder(order, brand, {
      adminUrl: "https://api.lichtval.nl",
      ad: { ad_source: "meta", ad_angle: "cadeau" },
      cjAutoPay: false,
    })
    expect(mail.subject).toContain("#1042")
    expect(mail.text).toContain("invalshoek cadeau")
    expect(mail.text).toContain("CJ_AUTO_PAY staat uit")
    expect(mail.text).toContain("https://api.lichtval.nl/app/orders/order_1")
  })
})

describe("parseAddress", () => {
  it("splits name and email", () => {
    expect(parseAddress("Lichtval <hallo@lichtval.nl>")).toEqual({ name: "Lichtval", email: "hallo@lichtval.nl" })
    expect(parseAddress("hallo@lichtval.nl")).toEqual({ email: "hallo@lichtval.nl" })
  })
})
