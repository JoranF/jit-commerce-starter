/**
 * Centrale configuratie voor de analytics-automatisering.
 * Event-namen en flag-keys moeten gelijk zijn aan
 * apps/storefront/src/lib/analytics/constants.ts.
 */

export const EVENTS = {
  pageview: "$pageview",
  productViewed: "product_viewed",
  buySectionViewed: "buy_section_viewed",
  productAddedToCart: "product_added_to_cart",
  cartViewed: "cart_viewed",
  checkoutStarted: "checkout_started",
  checkoutStepViewed: "checkout_step_viewed",
  checkoutStepCompleted: "checkout_step_completed",
  checkoutError: "checkout_error",
  paymentRedirected: "payment_redirected",
  orderCompleted: "order_completed",
} as const

/** De funnel die overal (dashboard, rapport) gebruikt wordt. */
export const FUNNEL = [
  EVENTS.productViewed,
  EVENTS.productAddedToCart,
  EVENTS.checkoutStarted,
  EVENTS.orderCompleted,
] as const

/**
 * De stappen in de checkout (property `step` op checkout_step_viewed/completed),
 * in volgorde. Gelijk aan CHECKOUT_STEPS in apps/storefront/src/lib/util/checkout-step.ts.
 */
export const CHECKOUT_STEPS = [
  { key: "address", label: "Adres" },
  { key: "delivery", label: "Verzending" },
  { key: "payment", label: "Betaalmethode" },
  { key: "review", label: "Controleren" },
] as const

export type ExperimentConfig = {
  /** Feature flag key (kebab-case), gelijk aan de storefront. */
  key: string
  name: string
  hypothesis: string
  variants: { key: string; name: string }[]
  /**
   * Beslisregels. Een winnaar wordt pas aangewezen als ALLES klopt:
   * genoeg bezoekers per variant, lang genoeg gelopen, en voldoende zekerheid.
   */
  minExposuresPerVariant: number
  minDays: number
  /** Bayesiaanse kans dat de variant beter is dan control (0-1). */
  winProbability: number
  /** Mag de automatisering de winnaar zelf op 100% zetten? (ook AUTO_SHIP_WINNERS=true nodig) */
  autoShip: boolean
}

export const EXPERIMENTS: ExperimentConfig[] = [
  {
    key: "atc-flow",
    name: "Na 'In winkelmand': bevestiging vs. direct naar checkout",
    hypothesis:
      "Wie na 'In winkelmand' meteen in de checkout landt, rekent vaker af dan wie eerst een bevestiging met 'Afrekenen'-knop ziet (één klik minder, minder twijfelmoment).",
    variants: [
      { key: "control", name: "Bevestiging + knop Afrekenen" },
      { key: "test", name: "Direct naar de checkout" },
    ],
    minExposuresPerVariant: 500,
    minDays: 14,
    winProbability: 0.95,
    autoShip: true,
  },
  {
    key: "pdp-cta-text",
    name: "Productpagina: tekst koopknop",
    hypothesis:
      "Een knop die het product noemt ('Bestel de lamp') verhoogt het aantal bestellingen t.o.v. 'In winkelmand'.",
    // Teksten per variant staan in de winkelconfig (store.buy.ctaText).
    variants: [
      { key: "control", name: "In winkelmand" },
      { key: "test", name: "Bestel de lamp" },
    ],
    minExposuresPerVariant: 500,
    minDays: 14,
    winProbability: 0.95,
    autoShip: true,
  },
]

export const DASHBOARD_NAME = "Webshop – Overzicht (automatisch)"
/** Tag waarmee scripts hun eigen insights herkennen (idempotent). */
export const MANAGED_TAG = "jit-commerce"
