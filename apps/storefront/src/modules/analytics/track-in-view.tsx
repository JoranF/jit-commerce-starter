"use client"

import type { AnalyticsEvent } from "@lib/analytics/constants"
import { useEffect, useRef } from "react"
import { track } from "./track"

/**
 * Stuurt één keer een event zodra het element voor minstens 40% in beeld is.
 * Voor scroll-diepte op de landingspagina: hoeveel bezoekers komen bij het koopblok?
 */
export default function TrackInView({
  event,
  properties,
  children,
  className,
}: {
  event: AnalyticsEvent
  properties?: Record<string, unknown>
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const sent = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !sent.current) {
          sent.current = true
          track(event, properties)
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
