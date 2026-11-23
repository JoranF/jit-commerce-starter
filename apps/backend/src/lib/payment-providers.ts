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
  "pp_mollie-paypal_mollie",
  "pp_mollie-apple-pay_mollie",
  // in3: eigen provider (src/modules/mollie-in3). Zet in3 ook aan in het Mollie-dashboard.
  "pp_mollie-in3_mollie",
]

/** Methodes die later bij kwamen en ook op bestaande regio's moeten. */
export const ADDED_LATER = ["pp_mollie-in3_mollie"]

/** Medusa's handmatige "testbetaling": plaatst een bestelling zonder dat er geld binnenkomt. */
export const TEST_PAYMENT_PROVIDER_ID = "pp_system_default"

export const isTestPaymentProvider = (id?: string | null) =>
  !!id && id.startsWith(TEST_PAYMENT_PROVIDER_ID)

/**
 * Welke betaalmethodes moet een regio hebben?
 * - Zonder Mollie: niets veranderen (lokaal testen met de testbetaling).
 * - Met Mollie: de testbetaling eraf (tenzij allowTest), en Mollie erbij als de regio
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
  let next = current.filter((id) => opts.allowTest || !isTestPaymentProvider(id))
  if (!next.some((id) => id.includes("mollie"))) {
    next = [...next, ...MOLLIE_PROVIDER_IDS.filter((id) => opts.available.includes(id))]
  }
  // Later toegevoegde methodes ook op een regio die al Mollie had (eenmalig nodig;
  // haal je hem in de admin weg, dan zet de volgende start hem terug: zet hem dan
  // in Mollie zelf uit).
  for (const id of ADDED_LATER) {
    if (opts.available.includes(id) && !next.includes(id)) next = [...next, id]
  }
  if (!next.length) {
    // Nooit een regio zonder betaalmethode achterlaten.
    return null
  }
  const same = next.length === current.length && next.every((id) => current.includes(id))
  return same ? null : next
}
