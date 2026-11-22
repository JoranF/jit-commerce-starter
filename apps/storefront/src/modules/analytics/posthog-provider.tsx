"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"
import { getConsent } from "./consent"
import { store } from "@stores"
import { VISITOR_COOKIE } from "@lib/analytics/constants"
import { AD_COOKIE, adProperties, decodeAdTouch } from "@lib/analytics/ad-touch"
import { flushTrackQueue } from "./track"

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
 *   (`cookieless_mode: "on_reject"` + `opt_out_capturing_by_default`): ook wie
 *   niet op de banner klikt telt mee in de funnel, anoniem. Zet cookieless mode
 *   ook aan in je PostHog project settings. A/B-resultaten tellen alleen
 *   bezoekers met toestemming (zie analytics/src/queries.ts).
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!KEY || posthog.__loaded) return
    const visitorId = readCookie(VISITOR_COOKIE)
    // Vaste properties op ELK event (ook $pageview en $feature_flag_called):
    // - store: meerdere winkels in één project
    // - ad_*: de advertentie waarmee deze bezoeker binnenkwam (funnel per advertentie)
    // Via before_send i.p.v. posthog.register: zonder toestemming (cookieless)
    // bewaart PostHog geregistreerde properties niet.
    const fixed = { store: store.id, ...adProperties(decodeAdTouch(readCookie(AD_COOKIE))) }
    posthog.init(KEY, {
      api_host: "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://eu.posthog.com",
      defaults: "2025-05-24",
      capture_pageview: "history_change",
      capture_pageleave: true,
      person_profiles: "identified_only",
      cookieless_mode: "on_reject",
      // Zonder deze regel meet PostHog NIETS zolang de bezoeker nog niet op de
      // banner heeft geklikt (de meeste mensen klikken nooit). Zo telt "nog geen
      // keuze" als weigeren: anoniem en cookieless meten, tot iemand accepteert.
      opt_out_capturing_by_default: true,
      bootstrap: visitorId ? { distinctID: visitorId } : undefined,
      // Sessie-opnames + heatmaps: zo zie je wáár mensen vastlopen (zet ze ook
      // aan in PostHog → Settings → Session replay / Heatmaps). Alle invoervelden
      // worden gemaskeerd; opnames lopen alleen na cookietoestemming.
      enable_heatmaps: true,
      session_recording: { maskAllInputs: true },
      before_send: (event) => {
        if (event) event.properties = { ...fixed, ...event.properties }
        return event
      },
    })
    // Keuze uit de cookiebanner (consent-banner.tsx) toepassen.
    const consent = getConsent()
    if (consent === "granted") posthog.opt_in_capturing()
    if (consent === "denied") posthog.opt_out_capturing()
    // Events die binnenkwamen voordat PostHog klaar was.
    flushTrackQueue()
  }, [])

  if (!KEY) return <>{children}</>

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}
