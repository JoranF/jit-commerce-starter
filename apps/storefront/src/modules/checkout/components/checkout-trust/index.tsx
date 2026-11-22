import { getRegionPolicies } from "@lib/util/store-policies"
import { policyValues } from "@lib/util/policy-values"
import { HttpTypes } from "@medusajs/types"
import { store } from "@stores"

/**
 * Geruststelling op het moment van betalen (CRO: twijfel is hier het grootst):
 * veilig betalen, bedenktijd, garantie en een echt aanspreekpunt. Termijnen uit het
 * winkelbeleid van de regio; ontbreekt dat, dan valt die regel weg.
 */
export default function CheckoutTrust({ cart }: { cart: HttpTypes.StoreCart }) {
  const values = policyValues(getRegionPolicies(cart.region))
  const lines = [
    "Veilig betalen via Mollie (iDEAL, Bancontact, creditcard)",
    values.levertijd ? `In huis binnen ${values.levertijd} werkdagen, met track & trace` : null,
    values.bedenktijd ? `${values.bedenktijd} dagen bedenktijd` : null,
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
