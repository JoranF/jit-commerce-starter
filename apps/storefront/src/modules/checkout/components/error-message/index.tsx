"use client"

import { EVENTS } from "@lib/analytics/constants"
import { track } from "@modules/analytics/track"
import { useEffect } from "react"

/**
 * Foutmelding in de checkout. Elke getoonde fout gaat ook als `checkout_error`
 * naar PostHog (met stap en melding), zodat je ziet welke fouten mensen tegenhouden.
 */
const ErrorMessage = ({
  error,
  "data-testid": dataTestid,
}: {
  error?: string | null
  "data-testid"?: string
}) => {
  useEffect(() => {
    if (!error || String(error).startsWith("NEXT_REDIRECT")) return
    track(EVENTS.checkoutError, {
      step: new URLSearchParams(window.location.search).get("step"),
      path: window.location.pathname,
      source: dataTestid,
      error: String(error).slice(0, 200),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  if (!error || String(error).startsWith("NEXT_REDIRECT")) {
    return null
  }

  return (
    <div
      className="pt-2 text-rose-500 text-small-regular"
      role="alert"
      data-testid={dataTestid}
    >
      <span>{error}</span>
    </div>
  )
}

export default ErrorMessage
