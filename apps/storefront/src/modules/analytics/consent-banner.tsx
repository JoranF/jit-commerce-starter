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

  // Compacte balk onderaan: mag de koopknop en het adresformulier niet afdekken.
  return (
    <div
      role="dialog"
      aria-label="Cookievoorkeuren"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-ui-border-base bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] small:inset-x-auto small:bottom-4 small:right-4 small:max-w-md small:rounded-lg small:border"
    >
      <div className="flex items-center gap-3">
        <p className="flex-1 text-xsmall-regular text-ui-fg-subtle">
          We gebruiken cookies om de winkel te verbeteren
          {META_PIXEL_ID ? " en onze advertenties te meten" : ""}. Weiger je,
          dan meten we alleen anoniem.{" "}
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
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
