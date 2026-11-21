"use client"

import posthog from "posthog-js"
import { useFeatureFlagVariantKey } from "posthog-js/react"
import { useEffect, useRef, useState } from "react"
import type { AnalyticsEvent, ExperimentKey } from "@lib/analytics/constants"

type Queued = [AnalyticsEvent, Record<string, unknown> | undefined]
const queue: Queued[] = []
const QUEUE_LIMIT = 50

/**
 * Stuur een event vanuit client code. Is PostHog nog niet geladen (init loopt in
 * de provider), dan wacht het event in een wachtrij en gaat het mee zodra
 * PostHog klaar is. Zonder PostHog-key gebeurt er niets.
 */
export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  if (!posthog.__loaded) {
    if (queue.length < QUEUE_LIMIT) queue.push([event, properties])
    return
  }
  posthog.capture(event, properties)
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
