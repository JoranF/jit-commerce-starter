import { Metadata } from "next"

import { getStorePolicies } from "@lib/data/store-policies"
import {
  PoliciesUnavailable,
  PolicyPage,
  ShippingSummary,
} from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Verzending",
  description: "Verzendkosten en levertijden.",
}

export default async function ShippingPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const { current, currencyCode } = await getStorePolicies(countryCode)

  return (
    <PolicyPage title="Verzending">
      {current ? (
        <>
          <p>
            We versturen je bestelling rechtstreeks vanuit het magazijn van onze leverancier.
            Zodra je pakket onderweg is, krijg je een e-mail met een track &amp; trace-code.
          </p>
          <ShippingSummary policies={current} currencyCode={currencyCode} />
          <p>
            Werkdagen zijn maandag tot en met vrijdag, zonder feestdagen. De verzendmethode en
            de definitieve kosten zie je bij het afrekenen.
          </p>
          <p>
            Is je pakket na de genoemde termijn nog niet binnen? Neem contact met ons op, dan
            zoeken we het voor je uit.
          </p>
        </>
      ) : (
        <PoliciesUnavailable />
      )}
    </PolicyPage>
  )
}
