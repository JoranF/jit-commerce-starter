"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect, useState } from "react"
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
 * - Cookiebanner: tot er toestemming is draait PostHog cookieless
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

  return (
    <div
      role="dialog"
      aria-label="Cookievoorkeuren"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-lg border border-ui-border-base bg-white p-4 shadow-lg small:left-auto"
    >
      <p className="text-small-regular text-ui-fg-subtle">
        We gebruiken analytische cookies om de winkel te verbeteren. Weiger je,
        dan meten we alleen anoniem.{" "}
        <a href="/privacy" className="underline">
          Privacyverklaring
        </a>
      </p>
      <div className="mt-3 flex gap-2 justify-end">
        <button
          onClick={() => answer(false)}
          className="px-3 py-1.5 text-small-regular rounded border border-ui-border-base"
        >
          Weigeren
        </button>
        <button
          onClick={() => answer(true)}
          className="px-3 py-1.5 text-small-regular rounded bg-ui-button-inverted text-ui-fg-on-inverted"
        >
          Accepteren
        </button>
      </div>
    </div>
  )
}
