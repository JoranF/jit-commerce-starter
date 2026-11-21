"use client"

import { CONSENT_COOKIE } from "@lib/analytics/constants"

export type Consent = "granted" | "denied" | "pending"

const EVENT = "jit:consent"

/** Keuze uit de cookiebanner (cookie `jit_consent`). */
export function getConsent(): Consent {
  if (typeof document === "undefined") return "pending"
  const value = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1]
  return value === "granted" || value === "denied" ? value : "pending"
}

/** Slaat de keuze 6 maanden op en laat de rest van de site het weten. */
export function setConsent(value: "granted" | "denied") {
  const maxAge = 60 * 60 * 24 * 182
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${maxAge}; samesite=lax${
    location.protocol === "https:" ? "; secure" : ""
  }`
  window.dispatchEvent(new CustomEvent<Consent>(EVENT, { detail: value }))
}

/** Roept `cb` aan met de huidige keuze en bij elke wijziging. Geeft een opruimfunctie terug. */
export function onConsent(cb: (value: Consent) => void) {
  cb(getConsent())
  const handler = (e: Event) => cb((e as CustomEvent<Consent>).detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
