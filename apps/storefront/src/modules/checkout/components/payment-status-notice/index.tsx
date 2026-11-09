"use client"

import { useSearchParams } from "next/navigation"

/** Toont een melding als de klant terugkomt van een mislukte/geannuleerde Mollie-betaling. */
export default function PaymentStatusNotice() {
  const params = useSearchParams()
  if (params.get("payment_status") !== "failed") return null
  return (
    <div className="mb-6 rounded-md border border-ui-border-error bg-ui-bg-subtle p-4 text-small-regular text-ui-fg-error">
      De betaling is niet gelukt of geannuleerd. Je bestelling is nog niet
      geplaatst — probeer het opnieuw of kies een andere betaalmethode.
    </div>
  )
}
