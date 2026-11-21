"use client"

import { EVENTS } from "@lib/analytics/constants"
import { CHECKOUT_STEPS, type CheckoutStep } from "@lib/util/checkout-step"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { track } from "./track"

const storageKey = (cartId: string) => `jit_checkout_${cartId}`

function readState(cartId: string): { started?: boolean; step?: CheckoutStep } {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey(cartId)) ?? "{}")
  } catch {
    return {}
  }
}

function writeState(cartId: string, state: { started?: boolean; step?: CheckoutStep }) {
  try {
    sessionStorage.setItem(storageKey(cartId), JSON.stringify(state))
  } catch {
    // sessionStorage geblokkeerd: dan meten we iets minder precies, geen probleem.
  }
}

/**
 * Meet de checkout per stap:
 * - `checkout_started`: één keer per winkelwagen (ook als de pagina opnieuw laadt)
 * - `checkout_step_viewed`: elke stap die in beeld komt
 * - `checkout_step_completed`: zodra de klant naar een latere stap gaat. Een
 *   overgeslagen stap (bv. verzending met één optie) telt ook als afgerond.
 *
 * De vorige stap staat in sessionStorage, omdat de checkout na het adres via een
 * server-redirect opnieuw rendert.
 */
export default function CheckoutStepTracker({
  cartId,
  value,
  currency,
  itemCount,
}: {
  cartId: string
  value?: number
  currency?: string
  itemCount?: number
}) {
  const step = useSearchParams().get("step") as CheckoutStep | null

  useEffect(() => {
    const state = readState(cartId)
    const props = { value, currency }

    if (!state.started) {
      track(EVENTS.checkoutStarted, { ...props, item_count: itemCount })
      state.started = true
    }

    if (step && CHECKOUT_STEPS.includes(step) && state.step !== step) {
      const from = state.step ? CHECKOUT_STEPS.indexOf(state.step) : -1
      const to = CHECKOUT_STEPS.indexOf(step)
      for (let i = from; from >= 0 && i < to; i++) {
        track(EVENTS.checkoutStepCompleted, {
          ...props,
          step: CHECKOUT_STEPS[i],
          step_number: i + 1,
          skipped: i !== from,
        })
      }
      track(EVENTS.checkoutStepViewed, { ...props, step, step_number: to + 1 })
      state.step = step
    }

    writeState(cartId, state)
  }, [cartId, step, value, currency, itemCount])

  return null
}
