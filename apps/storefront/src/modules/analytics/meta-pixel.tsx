"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { store } from "@stores"
import { onConsent } from "./consent"

/** Pixel ID: build arg gaat voor, anders uit de winkelconfig. Leeg = geen pixel. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || store.metaPixelId || ""

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue: unknown[][]
  push: Fbq
  loaded: boolean
  version: string
}

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

/** Standaard fbq-loader (zelfde als Meta's snippet, zonder inline script). */
function loadPixel(pixelId: string) {
  if (window.fbq) return
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue.push(args)
  } as Fbq
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = "2.0"
  fbq.queue = []
  window.fbq = fbq
  window._fbq = fbq
  const script = document.createElement("script")
  script.async = true
  script.src = "https://connect.facebook.net/en_US/fbevents.js"
  document.head.appendChild(script)
  fbq("init", pixelId)
}

/**
 * Stuur een standaard Meta-event (ViewContent, AddToCart, Purchase, …).
 * No-op zonder pixel of zonder toestemming. Met `eventId` ontdubbelt Meta dit
 * event tegen hetzelfde event uit de Conversions API (backend).
 */
export function pixelTrack(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || !window.fbq) return
  if (eventId) window.fbq("track", event, params ?? {}, { eventID: eventId })
  else window.fbq("track", event, params ?? {})
}

/**
 * Laadt de Meta Pixel pas nadat de bezoeker cookies accepteert (AVG/ePrivacy)
 * en stuurt een PageView bij elke paginawissel.
 */
export function MetaPixel() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!META_PIXEL_ID) return
    return onConsent((consent) => {
      if (consent !== "granted" || window.fbq) return
      loadPixel(META_PIXEL_ID)
      pixelTrack("PageView")
      lastPath.current = location.pathname
    })
  }, [])

  useEffect(() => {
    if (!window.fbq || lastPath.current === pathname) return
    lastPath.current = pathname
    pixelTrack("PageView")
  }, [pathname])

  return null
}
