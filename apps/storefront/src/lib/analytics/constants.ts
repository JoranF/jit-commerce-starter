/**
 * Eén plek voor alle analytics-namen, zodat storefront, backend en de
 * automatiseringsscripts (analytics/) dezelfde events en flags gebruiken.
 */

/** Cookie met een stabiele bezoekers-ID (gezet in middleware.ts). */
export const VISITOR_COOKIE = "jit_vid"
/** Request-header waarmee middleware de ID bij het allereerste bezoek doorgeeft. */
export const VISITOR_HEADER = "x-jit-vid"

/** E-commerce funnel events. Houd deze namen gelijk aan analytics/src/config.ts. */
export const EVENTS = {
  productViewed: "product_viewed",
  productAddedToCart: "product_added_to_cart",
  cartViewed: "cart_viewed",
  checkoutStarted: "checkout_started",
  checkoutStepCompleted: "checkout_step_completed",
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
  /** Tekst van de winkelwagen-knop op de productpagina. */
  pdpCtaText: "pdp-cta-text",
} as const

export type ExperimentKey = (typeof EXPERIMENTS)[keyof typeof EXPERIMENTS]
