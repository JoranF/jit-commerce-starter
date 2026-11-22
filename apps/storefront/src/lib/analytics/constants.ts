/**
 * Eén plek voor alle analytics-namen, zodat storefront, backend en de
 * automatiseringsscripts (analytics/) dezelfde events en flags gebruiken.
 */

/** Cookie met een stabiele bezoekers-ID (gezet in middleware.ts). */
export const VISITOR_COOKIE = "jit_vid"
/** Request-header waarmee middleware de ID bij het allereerste bezoek doorgeeft. */
export const VISITOR_HEADER = "x-jit-vid"
/** Cookie met de keuze uit de cookiebanner: "granted" of "denied". */
export const CONSENT_COOKIE = "jit_consent"

/** E-commerce funnel events. Houd deze namen gelijk aan analytics/src/config.ts. */
export const EVENTS = {
  productViewed: "product_viewed",
  /** Bezoeker heeft het koopblok (#lamp) op de landingspagina in beeld gehad. */
  buySectionViewed: "buy_section_viewed",
  productAddedToCart: "product_added_to_cart",
  cartViewed: "cart_viewed",
  checkoutStarted: "checkout_started",
  /** Elke checkout-stap die in beeld komt (property `step`: address/delivery/payment/review). */
  checkoutStepViewed: "checkout_step_viewed",
  /** Stap afgerond (property `step`). Samen met viewed zie je per stap waar mensen blijven hangen. */
  checkoutStepCompleted: "checkout_step_completed",
  /** Foutmelding getoond in de checkout (property `step`, `error`). */
  checkoutError: "checkout_error",
  paymentRedirected: "payment_redirected",
  /** Server-side vanuit Medusa (subscribers/analytics-order-placed.ts). */
  orderCompleted: "order_completed",
} as const

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS]

/**
 * Experimenten (feature flags) die de storefront kent. Maak ze aan in PostHog
 * (of laat `analytics/` dat doen met `yarn setup`) met exact deze keys.
 */
export const EXPERIMENTS = {
  /** Koopblok: control = 1 lamp voorgeselecteerd, test = de set (store.experimentContent.defaultPack). */
  defaultPack: "default-pack",
  /** Hero: control = store.hero, test = store.experimentContent.heroCopy.test. */
  heroCopy: "hero-copy",
  /** Tekst van de winkelwagen-knop op de productpagina. */
  pdpCtaText: "pdp-cta-text",
  /**
   * Na "In winkelmand": control = bevestiging met knop "Afrekenen",
   * test = meteen door naar de checkout.
   */
  atcFlow: "atc-flow",
} as const

export type ExperimentKey = (typeof EXPERIMENTS)[keyof typeof EXPERIMENTS]
