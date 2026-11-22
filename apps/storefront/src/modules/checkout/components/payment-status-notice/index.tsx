"use client"

import { useSearchParams } from "next/navigation"

/**
 * Melding als de klant terugkomt van Mollie zonder afgeronde bestelling:
 * - failed: niet gelukt of geannuleerd → opnieuw proberen.
 * - pending: de bank verwerkt de betaling nog (komt zelden voor bij iDEAL). Dan niet
 *   opnieuw laten betalen: de Mollie-webhook rondt de bestelling af zodra het geld binnen is.
 */
export default function PaymentStatusNotice() {
  const status = useSearchParams().get("payment_status")
  if (status === "pending") {
    return (
      <div
        role="status"
        className="mb-6 rounded-md border border-ui-border-base bg-ui-bg-subtle p-4 text-small-regular text-ui-fg-base"
      >
        Je betaling wordt nog verwerkt door je bank. Betaal niet opnieuw: zodra de
        betaling binnen is, krijg je de bevestiging van je bestelling per e-mail.
      </div>
    )
  }
  if (status !== "failed") return null
  return (
    <div
      role="alert"
      className="mb-6 rounded-md border border-ui-border-error bg-ui-bg-subtle p-4 text-small-regular text-ui-fg-error"
    >
      De betaling is niet gelukt of geannuleerd. Je bestelling is nog niet
      geplaatst. Probeer het opnieuw of kies een andere betaalmethode.
    </div>
  )
}
