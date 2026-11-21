"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"
import { getConsent } from "./consent"
import { store } from "@stores"
import { VISITOR_COOKIE } from "@lib/analytics/constants"

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1]
}

/**
 * PostHog in de browser:
 * - Events gaan via /ingest (rewrite in next.config.js) → minder geblokkeerd door adblockers.
 * - distinct_id = de `jit_vid` cookie uit middleware, zodat server en browser
 *   dezelfde bezoeker zien (nodig voor A/B-testen zonder flikkering).
 * - Cookiebanner (consent-banner.tsx): tot er toestemming is draait PostHog cookieless
 *   (`cookieless_mode: "on_reject"`). Zet cookieless mode ook aan in je
 *   PostHog project settings.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!KEY || posthog.__loaded) return
    const visitorId = readCookie(VISITOR_COOKIE)
    posthog.init(KEY, {
      api_host: "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://eu.posthog.com",
      defaults: "2025-05-24",
      capture_pageview: "history_change",
      capture_pageleave: true,
      person_profiles: "identified_only",
      cookieless_mode: "on_reject",
      bootstrap: visitorId ? { distinctID: visitorId } : undefined,
    })
    // Elk event krijgt de winkel mee, zodat meerdere winkels in één project passen.
    posthog.register({ store: store.id })
    // Keuze uit de cookiebanner (consent-banner.tsx) toepassen.
    const consent = getConsent()
    if (consent === "granted") posthog.opt_in_capturing()
    if (consent === "denied") posthog.opt_out_capturing()
  }, [])

  if (!KEY) return <>{children}</>

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}
