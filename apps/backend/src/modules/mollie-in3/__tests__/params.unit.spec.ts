import { in3PaymentExtras, toE164 } from "../params"

describe("mollie in3", () => {
  it("bouwt factuuradres en één orderregel gelijk aan het bedrag", () => {
    const x = in3PaymentExtras(
      {
        first_name: " Jan ",
        last_name: "de Vries",
        email: "jan@example.nl",
        phone: "06 1234 5678",
        address_1: "Dorpsstraat 1",
        postal_code: "1234 AB",
        city: "Utrecht",
        country_code: "nl",
      },
      134,
      "eur",
      "Lichtval"
    )
    expect(x.billingAddress).toEqual({
      givenName: "Jan",
      familyName: "de Vries",
      email: "jan@example.nl",
      phone: "+31612345678",
      streetAndNumber: "Dorpsstraat 1",
      postalCode: "1234 AB",
      city: "Utrecht",
      country: "NL",
    })
    expect(x.lines).toHaveLength(1)
    expect(x.lines[0].totalAmount).toEqual({ value: "134.00", currency: "EUR" })
    expect(x.lines[0].unitPrice).toEqual(x.lines[0].totalAmount)
  })

  it("telefoon naar E.164", () => {
    expect(toE164("0470 12 34 56", "be")).toBe("+32470123456")
    expect(toE164("+31 6 12345678", "nl")).toBe("+31612345678")
    expect(toE164("0031612345678", "nl")).toBe("+31612345678")
    expect(toE164("", "nl")).toBeUndefined()
  })
})
