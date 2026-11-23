import { getRegionPolicies } from "@lib/util/store-policies"
import { policyValues } from "@lib/util/policy-values"
import { HttpTypes } from "@medusajs/types"
import { store } from "@stores"

/**
 * Geruststelling op het moment van betalen (CRO: twijfel is hier het grootst):
 * veilig betalen, bedenktijd, garantie en een echt aanspreekpunt. Termijnen uit het
 * winkelbeleid van de regio; ontbreekt dat, dan valt die regel weg.
 */
const METHOD_LABELS: Record<string, string> = {
  ideal: "iDEAL",
  bancontact: "Bancontact",
  card: "creditcard",
  paypal: "PayPal",
  applepay: "Apple Pay",
  in3: "in3",
}

export default function CheckoutTrust({ cart }: { cart: HttpTypes.StoreCart }) {
  const policies = getRegionPolicies(cart.region)
  const values = policyValues(policies)
  const methods = (store.paymentMethods ?? ["ideal", "bancontact", "card"])
    .filter((m) => m !== "in3") // in3 krijgt een eigen regel
    .map((m) => METHOD_LABELS[m] ?? m)
  const lines = [
    `Veilig betalen via Mollie: ${methods.join(", ")}`,
    store.paymentMethods?.includes("in3") ? "Of in 3 termijnen betalen met in3, zonder rente" : null,
    values.levertijd ? `In huis binnen ${values.levertijd} werkdagen, met track & trace` : null,
    policies?.shippingRate === 0 && policies?.freeReturns
      ? "Gratis verzending en gratis retour"
      : policies?.shippingRate === 0
      ? "Gratis verzending"
      : null,
    values.bedenktijd ? `${values.bedenktijd} dagen bedenktijd: niet blij, dan krijg je je geld terug` : null,
    "2 jaar garantie",
    store.company.email ? `Vragen? Mail ${store.company.email}` : null,
  ].filter((l): l is string => !!l)

  return (
    <ul className="flex flex-col gap-y-2 rounded-md border border-ui-border-base p-4 text-small-regular text-ui-fg-subtle" data-testid="checkout-trust">
      {lines.map((l) => (
        <li key={l} className="flex items-start gap-2">
          <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 10.5l3.5 3.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {l}
        </li>
      ))}
    </ul>
  )
}
