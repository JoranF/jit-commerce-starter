"use client"

import posthog from "posthog-js"
import { useFeatureFlagVariantKey } from "posthog-js/react"
import { useEffect, useRef, useState } from "react"
import { EVENTS, type AnalyticsEvent, type ExperimentKey } from "@lib/analytics/constants"
import { pixelTrack } from "./meta-pixel"

type Props = Record<string, unknown>
const upper = (v: unknown) => (typeof v === "string" ? v.toUpperCase() : undefined)

/** Onze funnel-events → Meta standaard-events (alleen als de pixel aan staat). */
const TO_META: Partial<Record<AnalyticsEvent, (p: Props) => [string, Props]>> = {
  [EVENTS.productViewed]: (p) => [
    "ViewContent",
    {
      content_ids: [p.product_id],
      content_name: p.product_name,
      content_type: "product",
      // Zonder waarde kan Meta niet op waarde optimaliseren en is ViewContent minder bruikbaar.
      ...(typeof p.value === "number" ? { value: p.value, currency: upper(p.currency) ?? "EUR" } : {}),
    },
  ],
  [EVENTS.productAddedToCart]: (p) => [
    "AddToCart",
    {
      content_ids: [p.product_id],
      content_name: p.product_name,
      content_type: "product",
      contents: [{ id: p.product_id, quantity: p.quantity ?? 1 }],
      value: p.price,
      currency: upper(p.currency),
    },
  ],
  [EVENTS.checkoutStarted]: (p) => [
    "InitiateCheckout",
    { value: p.value, currency: upper(p.currency), num_items: p.item_count },
  ],
  [EVENTS.paymentRedirected]: (p) => [
    "AddPaymentInfo",
    { value: p.value, currency: upper(p.currency) },
  ],
}

type Queued = [AnalyticsEvent, Props | undefined]
const queue: Queued[] = []
const QUEUE_LIMIT = 50

/**
 * Stuur een event vanuit client code: naar PostHog en, als er een Meta-tegenhanger
 * is, naar de Meta Pixel (alleen na toestemming). Is PostHog nog niet geladen
 * (init loopt in de provider), dan wacht het event in een wachtrij en gaat het
 * mee zodra PostHog klaar is.
 */
export function track(event: AnalyticsEvent, properties?: Props) {
  if (typeof window === "undefined") return
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    if (posthog.__loaded) posthog.capture(event, properties)
    else if (queue.length < QUEUE_LIMIT) queue.push([event, properties])
  }
  const meta = TO_META[event]
  if (meta) pixelTrack(...meta(properties ?? {}))
}

/** Aangeroepen door de provider zodra posthog.init klaar is. */
export function flushTrackQueue() {
  while (queue.length) {
    const [event, properties] = queue.shift()!
    posthog.capture(event, properties)
  }
}

/**
 * Plaats in een server component om een event te sturen bij het tonen van een
 * pagina, bv. <TrackEvent event={EVENTS.productViewed} properties={{...}} />
 */
export function TrackEvent({
  event,
  properties,
}: {
  event: AnalyticsEvent
  properties?: Record<string, unknown>
}) {
  const sent = useRef(false)
  useEffect(() => {
    if (sent.current) return
    sent.current = true
    track(event, properties)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])
  return null
}

/**
 * A/B-test variant in client components.
 * Geeft `{ variant, ready }`. Tot flags geladen zijn (max ~1s) is variant "control",
 * zodat bezoekers zonder PostHog of met adblocker gewoon de standaardversie zien.
 */
export function useExperiment(flag: ExperimentKey) {
  const variant = useFeatureFlagVariantKey(flag)
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 1000)
    return () => clearTimeout(t)
  }, [])
  const ready = variant !== undefined || timedOut
  return {
    variant: typeof variant === "string" ? variant : variant ? "test" : "control",
    ready,
  }
}
