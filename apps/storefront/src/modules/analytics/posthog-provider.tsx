"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect, useState } from "react"
import { VISITOR_COOKIE } from "@lib/analytics/constants"
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
 * - Cookiebanner: tot er toestemming is draait PostHog cookieless
 *   (`cookieless_mode: "on_reject"` + `opt_out_capturing_by_default`): ook wie
 *   niet op de banner klikt telt mee in de funnel, anoniem. Zet cookieless mode
 *   ook aan in je PostHog project settings. A/B-resultaten tellen alleen
 *   bezoekers met toestemming (zie analytics/src/queries.ts).
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
      loaded: () => flushTrackQueue(),
    })
  }, [])

  if (!KEY) return <>{children}</>

  return (
    <PHProvider client={posthog}>
      {children}
      <ConsentBanner />
    </PHProvider>
  )
}

function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(posthog.get_explicit_consent_status?.() === "pending")
    }, 300)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  const answer = (accept: boolean) => {
    if (accept) posthog.opt_in_capturing()
    else posthog.opt_out_capturing()
    setVisible(false)
  }

  // Compacte balk onderaan: mag de koopknop en het adresformulier niet afdekken.
  return (
    <div
      role="dialog"
      aria-label="Cookievoorkeuren"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-ui-border-base bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] small:inset-x-auto small:bottom-4 small:right-4 small:max-w-md small:rounded-lg small:border"
    >
      <div className="flex items-center gap-3">
        <p className="flex-1 text-xsmall-regular text-ui-fg-subtle">
          Analytische cookies helpen ons de winkel te verbeteren. Weiger je, dan
          meten we alleen anoniem.{" "}
          <a href="/privacy" className="underline">
            Privacy
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => answer(false)}
            className="rounded border border-ui-border-base px-3 py-1.5 text-small-regular"
          >
            Weigeren
          </button>
          <button
            onClick={() => answer(true)}
            className="rounded bg-ui-button-inverted px-3 py-1.5 text-small-regular text-ui-fg-on-inverted"
          >
            Accepteren
          </button>
        </div>
      </div>
    </div>
  )
}
