"use client"

import posthog from "posthog-js"
import { useFeatureFlagVariantKey } from "posthog-js/react"
import { useEffect, useRef, useState } from "react"
import type { AnalyticsEvent, ExperimentKey } from "@lib/analytics/constants"

/** Stuur een event vanuit client code. No-op als PostHog niet geladen is. */
export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (typeof window === "undefined" || !posthog.__loaded) return
  posthog.capture(event, properties)
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
    // Wacht kort tot posthog.init klaar is (provider init in useEffect).
    const t = setTimeout(() => {
      track(event, properties)
      sent.current = true
    }, 50)
    return () => clearTimeout(t)
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
