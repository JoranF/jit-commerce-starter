"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { HttpTypes } from "@medusajs/types"

/**
 * De handmatige testbetaling (pp_system_default) plaatst een bestelling zonder dat er
 * geld binnenkomt. Nooit tonen als er een echte betaalmethode is, en nooit in een
 * productie-build, tenzij NEXT_PUBLIC_ALLOW_TEST_PAYMENT=true (alleen om te testen).
 * De backend haalt hem ook van de regio zodra MOLLIE_API_KEY gezet is (bootstrap).
 */
function withoutTestPayment<T extends { id: string }>(providers: T[]): T[] {
  if (process.env.NEXT_PUBLIC_ALLOW_TEST_PAYMENT === "true") {
    return providers
  }
  const real = providers.filter((p) => !p.id.startsWith("pp_system_default"))
  return real.length || process.env.NODE_ENV === "production" ? real : providers
}

/** PayPal bieden we niet aan, ook niet als hij per ongeluk in de admin aan de regio hangt. */
const withoutExcluded = <T extends { id: string }>(providers: T[]): T[] =>
  providers.filter((p) => !/paypal/i.test(p.id))

/** iDEAL eerst (NL), dan Bancontact (BE), daarna de rest op naam. */
const ORDER = [/ideal/i, /bancontact/i, /apple-pay/i, /card/i]
const rank = (id: string) => {
  const i = ORDER.findIndex((re) => re.test(id))
  return i === -1 ? ORDER.length : i
}
const byCheckoutOrder = (a: { id: string }, b: { id: string }) =>
  rank(a.id) - rank(b.id) || (a.id > b.id ? 1 : -1)

export const listCartPaymentMethods = async (regionId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("payment_providers")),
    revalidate: 60,
  }

  return sdk.client
    .fetch<HttpTypes.StorePaymentProviderListResponse>(
      `/store/payment-providers`,
      {
        method: "GET",
        query: { region_id: regionId },
        headers,
        next,
      }
    )
    .then(({ payment_providers }) =>
      withoutTestPayment(withoutExcluded(payment_providers)).sort(byCheckoutOrder)
    )
    .catch(() => {
      return null
    })
}
