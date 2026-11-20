import { Metadata } from "next"
import { STORE_NAME } from "@lib/util/site"
import { CompanyDetails, PlaceholderNotice, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Algemene voorwaarden",
  description: `De voorwaarden voor bestellingen bij ${STORE_NAME}.`,
}

/**
 * Basisversie voor een webwinkel voor consumenten. Laat deze tekst juridisch
 * controleren (of gebruik bv. de voorwaarden van Thuiswinkel.org) vóór livegang.
 */
export default function TermsPage() {
  return (
    <PolicyPage title="Algemene voorwaarden">
      <PlaceholderNotice />
      <p>
        Deze voorwaarden gelden voor elke bestelling bij {STORE_NAME}. Door te bestellen ga je
        ermee akkoord.
      </p>
      <h2>Wie wij zijn</h2>
      <CompanyDetails />
      <h2>Aanbod en prijzen</h2>
      <p>
        Alle prijzen zijn in euro en inclusief btw. Verzendkosten zie je voordat je betaalt.
        Kennelijke vergissingen of fouten in het aanbod binden ons niet.
      </p>
      <h2>De overeenkomst</h2>
      <p>
        De overeenkomst komt tot stand zodra je de bestelling hebt betaald. Je ontvangt een
        bevestiging per e-mail.
      </p>
      <h2>Levering</h2>
      <p>
        We leveren op het adres dat je bij de bestelling opgeeft, binnen de termijn op de pagina
        Verzending. Lukt dat niet, dan laten we het je weten en mag je de bestelling kosteloos
        ontbinden.
      </p>
      <h2>Bedenktijd</h2>
      <p>
        Je hebt het recht om de overeenkomst binnen de bedenktijd zonder opgaaf van reden te
        ontbinden. Hoe dat werkt, lees je op de pagina Retourneren.
      </p>
      <h2>Garantie en klachten</h2>
      <p>
        Je hebt recht op een product dat werkt zoals je mag verwachten (wettelijke garantie).
        Klopt er iets niet, meld het ons dan zo snel mogelijk, liefst met een foto. We reageren
        binnen 14 dagen. Kom je er met ons niet uit, dan kun je terecht bij het
        ODR-platform van de Europese Commissie:{" "}
        <a href="https://ec.europa.eu/consumers/odr" rel="noreferrer" target="_blank">
          ec.europa.eu/consumers/odr
        </a>
        .
      </p>
      <h2>Toepasselijk recht</h2>
      <p>Op deze voorwaarden is Nederlands recht van toepassing.</p>
    </PolicyPage>
  )
}
