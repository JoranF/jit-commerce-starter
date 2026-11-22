/**
 * Betaalmethodes van Mollie (@variablevic/mollie-payments-medusa) die we aan de regio
 * koppelen, in de volgorde waarin ze in de checkout staan. iDEAL eerst (NL),
 * Bancontact voor BE. "Alle betaalmethodes (Mollie)" (hosted checkout, bv. Klarna)
 * kun je in de admin bij de regio aanvinken als je die in Mollie aanzet.
 */
export const MOLLIE_PROVIDER_IDS = [
  "pp_mollie-ideal_mollie",
  "pp_mollie-bancontact_mollie",
  "pp_mollie-card_mollie",
  "pp_mollie-apple-pay_mollie",
]

/** Betaalmethodes die we niet aanbieden (geen PayPal). Bootstrap haalt ze ook van bestaande regio's. */
export const EXCLUDED_PROVIDER_PATTERNS = [/paypal/i]

export const isExcludedProvider = (id?: string | null) =>
  !!id && EXCLUDED_PROVIDER_PATTERNS.some((re) => re.test(id))

/** Medusa's handmatige "testbetaling": plaatst een bestelling zonder dat er geld binnenkomt. */
export const TEST_PAYMENT_PROVIDER_ID = "pp_system_default"

export const isTestPaymentProvider = (id?: string | null) =>
  !!id && id.startsWith(TEST_PAYMENT_PROVIDER_ID)

/**
 * Welke betaalmethodes moet een regio hebben?
 * - Zonder Mollie: niets veranderen (lokaal testen met de testbetaling).
 * - Met Mollie: PayPal en de testbetaling eraf (tenzij allowTest), en Mollie erbij als de regio
 *   nog geen enkele Mollie-methode heeft. Een eigen selectie in de admin blijft staan.
 * Geeft null als er niets hoeft te veranderen.
 */
export function wantedRegionProviders(
  current: string[],
  opts: { mollie: boolean; allowTest: boolean; available: string[] }
): string[] | null {
  if (!opts.mollie) {
    return null
  }
  let next = current.filter(
    (id) => !isExcludedProvider(id) && (opts.allowTest || !isTestPaymentProvider(id))
  )
  if (!next.some((id) => id.includes("mollie"))) {
    next = [...next, ...MOLLIE_PROVIDER_IDS.filter((id) => opts.available.includes(id))]
  }
  if (!next.length) {
    // Nooit een regio zonder betaalmethode achterlaten.
    return null
  }
  const same = next.length === current.length && next.every((id) => current.includes(id))
  return same ? null : next
}
