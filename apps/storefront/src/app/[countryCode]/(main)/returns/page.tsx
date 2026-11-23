import { Metadata } from "next"

import { getStorePolicies } from "@lib/data/store-policies"
import { STORE_NAME } from "@lib/util/site"
import {
  CompanyDetails,
  PlaceholderNotice,
  PoliciesUnavailable,
  PolicyPage,
} from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  // Staat het bedrijfsadres op: wel bereikbaar via de site, niet in zoekmachines.
  robots: { index: false, follow: true },
  title: "Retourneren",
  description: "Bedenktijd, retourneren en terugbetaling.",
}

export default async function ReturnsPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const { current } = await getStorePolicies(countryCode)

  return (
    <PolicyPage title="Retourneren">
      <PlaceholderNotice />
      {current ? (
        <>
          <p>
            Je hebt {current.returnWindowDays} dagen bedenktijd. Die gaat in op de dag nadat je
            de bestelling hebt ontvangen. Binnen die termijn kun je de koop zonder opgaaf van
            reden ontbinden.
          </p>
          <h2>Zo werkt het</h2>
          <p>
            Laat ons binnen de bedenktijd weten dat je de bestelling wilt terugsturen, per
            e-mail of met het modelformulier hieronder. Je krijgt dan van ons {current.freeReturns ? "een gratis retourlabel" : "het retouradres"}.
            Stuur het product daarna binnen 14 dagen terug, compleet en goed verpakt.
          </p>
          <p>
            {current.freeReturns
              ? "Het terugsturen is gratis."
              : "De kosten voor het terugsturen zijn voor jou."}{" "}
            Je krijgt het aankoopbedrag, inclusief de standaard verzendkosten, binnen 14 dagen
            terug, en uiterlijk zodra wij het product hebben ontvangen of je hebt aangetoond dat
            je het hebt teruggestuurd.
          </p>
          <h2>Modelformulier voor herroeping</h2>
          <p>Vul dit formulier alleen in als je de overeenkomst wilt herroepen, en stuur het naar:</p>
          <CompanyDetails />
          <p className="whitespace-pre-line rounded-[2px] border border-brand-ink/15 p-5">
            {`Aan ${STORE_NAME}:

Ik deel u hierbij mede dat ik onze overeenkomst betreffende de verkoop van de volgende producten herroep:
Besteld op / ontvangen op:
Bestelnummer:
Naam:
Adres:
Handtekening (alleen bij een papieren formulier):
Datum:`}
          </p>
        </>
      ) : (
        <PoliciesUnavailable />
      )}
    </PolicyPage>
  )
}
