/**
 * Centrale configuratie voor de analytics-automatisering.
 * Event-namen en flag-keys moeten gelijk zijn aan
 * apps/storefront/src/lib/analytics/constants.ts.
 */

export const EVENTS = {
  pageview: "$pageview",
  productViewed: "product_viewed",
  productAddedToCart: "product_added_to_cart",
  cartViewed: "cart_viewed",
  checkoutStarted: "checkout_started",
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
    key: "pdp-cta-text",
    name: "Productpagina: tekst winkelwagen-knop",
    hypothesis:
      "Een knop die urgentie + levertijd noemt ('Bestel nu – morgen in huis') verhoogt het aantal bestellingen t.o.v. 'In winkelwagen'.",
    variants: [
      { key: "control", name: "In winkelwagen" },
      { key: "test", name: "Bestel nu – morgen in huis" },
    ],
    minExposuresPerVariant: 500,
    minDays: 14,
    winProbability: 0.95,
    autoShip: false,
  },
]

export const DASHBOARD_NAME = "Webshop – Overzicht (automatisch)"
/** Tag waarmee scripts hun eigen insights herkennen (idempotent). */
export const MANAGED_TAG = "jit-commerce"
