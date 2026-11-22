"use client"

import posthog from "posthog-js"
import { useEffect, useState } from "react"
import type { ExperimentKey } from "@lib/analytics/constants"

/**
 * A/B-test voor iets dat direct in beeld staat (bv. de hero-kop). De variant mag
 * alleen wisselen vóórdat de bezoeker het ziet (`deadlineMs`, bv. de duur van de
 * intro-animatie). Zijn de flags er pas later, dan blijft het control en telt deze
 * bezoeker niet mee in de test (geen exposure-event), zodat de uitslag eerlijk blijft.
 *
 * Exposure (`$feature_flag_called`) sturen we zelf, alleen als de variant op tijd
 * bekend en dus echt getoond is.
 */
export function useTimedExperiment(flag: ExperimentKey, deadlineMs: number, enabled = true) {
  const [variant, setVariant] = useState("control")

  useEffect(() => {
    if (!enabled || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    let decided = false
    const decide = () => {
      if (decided) return
      const v = posthog.getFeatureFlag(flag, { send_event: false })
      if (v === undefined) return
      decided = true
      const key = typeof v === "string" ? v : v ? "test" : "control"
      if (v !== false) {
        posthog.capture("$feature_flag_called", { $feature_flag: flag, $feature_flag_response: v })
      }
      setVariant(key)
    }
    const timer = setTimeout(() => {
      decided = true // te laat: control, en deze bezoeker telt niet mee
    }, deadlineMs)
    decide()
    const off = posthog.onFeatureFlags(() => decide())
    return () => {
      clearTimeout(timer)
      if (typeof off === "function") off()
    }
  }, [flag, deadlineMs, enabled])

  return variant
}
