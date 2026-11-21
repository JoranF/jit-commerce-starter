"use client"

import Link from "next/link"
import posthog from "posthog-js"
import { useEffect, useState } from "react"
import { getConsent, onConsent, setConsent } from "./consent"
import { META_PIXEL_ID } from "./meta-pixel"

const POSTHOG = !!process.env.NEXT_PUBLIC_POSTHOG_KEY

/**
 * Cookiebanner voor analytics (PostHog) en advertenties (Meta Pixel).
 * - Weigeren: PostHog meet alleen anoniem (cookieless), de pixel laadt niet.
 * - Accepteren: PostHog met cookies, pixel aan, en aankopen gaan ook via de
 *   Conversions API naar Meta (backend leest de keuze uit de winkelwagen).
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!POSTHOG && !META_PIXEL_ID) return
    const t = setTimeout(() => setVisible(getConsent() === "pending"), 300)
    // Houd PostHog gelijk met de keuze (ook bij een eerder gemaakte keuze).
    const off = onConsent((value) => {
      if (!posthog.__loaded) return
      if (value === "granted") posthog.opt_in_capturing()
      if (value === "denied") posthog.opt_out_capturing()
    })
    return () => {
      clearTimeout(t)
      off()
    }
  }, [])

  if (!visible) return null

  const answer = (accept: boolean) => {
    setConsent(accept ? "granted" : "denied")
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Cookievoorkeuren"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-lg border border-ui-border-base bg-white p-4 shadow-lg small:left-auto"
    >
      <p className="text-small-regular text-ui-fg-subtle">
        We gebruiken cookies om de winkel te verbeteren
        {META_PIXEL_ID ? " en om onze advertenties op Facebook en Instagram te meten" : ""}.
        Weiger je, dan meten we alleen anoniem.{" "}
        <Link href="/privacy" className="underline">
          Privacyverklaring
        </Link>
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
