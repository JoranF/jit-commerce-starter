/**
 * in3 (betalen in 3 termijnen) via Mollie. Mollie wil voor in3 een volledig factuuradres
 * (naam, e-mail, telefoon) en orderregels. De Mollie-plugin stuurt die niet mee, daarom
 * deze eigen provider. Puur, zodat het getest is (`__tests__/params.unit.spec.ts`).
 *
 * De storefront geeft het adres mee in `data.billing` bij het starten van de betaalsessie.
 * Het bedrag komt altijd van de server (Medusa); we maken er één orderregel van zodat de
 * som van de regels exact gelijk is aan het bedrag (eis van Mollie).
 */
export type In3Billing = {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  address_1?: string | null
  postal_code?: string | null
  city?: string | null
  country_code?: string | null
}

const clean = (v: unknown, max = 100) => (typeof v === "string" ? v.trim().slice(0, max) : "")

/** Telefoon naar E.164 (Mollie). NL/BE-nummers zonder landcode krijgen +31/+32. */
export function toE164(phone: string, country: string): string | undefined {
  const digits = phone.replace(/[^\d+]/g, "")
  if (!digits) return undefined
  if (digits.startsWith("+")) return digits
  if (digits.startsWith("00")) return `+${digits.slice(2)}`
  const cc = country.toLowerCase() === "be" ? "32" : country.toLowerCase() === "nl" ? "31" : ""
  if (cc && digits.startsWith("0")) return `+${cc}${digits.slice(1)}`
  return undefined
}

export function in3PaymentExtras(
  billing: In3Billing | undefined,
  amount: number,
  currency: string,
  description: string
) {
  const b = billing ?? {}
  const country = clean(b.country_code, 2).toUpperCase()
  const phone = toE164(clean(b.phone, 30), country)
  const value = Number(amount).toFixed(2)
  const money = { value, currency: currency.toUpperCase() }
  return {
    billingAddress: {
      givenName: clean(b.first_name),
      familyName: clean(b.last_name),
      email: clean(b.email, 200),
      ...(phone ? { phone } : {}),
      streetAndNumber: clean(b.address_1, 200),
      postalCode: clean(b.postal_code, 20),
      city: clean(b.city),
      country,
    },
    lines: [
      {
        type: "physical",
        description: description.slice(0, 100) || "Bestelling",
        quantity: 1,
        unitPrice: money,
        totalAmount: money,
      },
    ],
  }
}
