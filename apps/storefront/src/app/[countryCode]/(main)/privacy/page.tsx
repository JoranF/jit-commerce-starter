import { Metadata } from "next"
import { META_PIXEL_ID } from "@modules/analytics/meta-pixel"
import { STORE_NAME } from "@lib/util/site"
import { CompanyDetails, PlaceholderNotice, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  // Staat het bedrijfsadres op: wel bereikbaar via de site, niet in zoekmachines.
  robots: { index: false, follow: true },
  title: "Privacy",
  description: `Hoe ${STORE_NAME} met je gegevens omgaat.`,
}

/** Beschrijft de verwerkingen van deze winkel (Medusa, Mollie, PostHog, Meta, leverancier). */
export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy">
      <PlaceholderNotice />
      <p>
        {STORE_NAME} gebruikt je gegevens alleen om je bestelling te verwerken en de winkel te
        verbeteren. Hieronder staat welke gegevens, waarvoor en met wie we ze delen.
      </p>
      <h2>Welke gegevens</h2>
      <p>
        Naam, adres, e-mailadres, telefoonnummer (als je dat opgeeft) en je bestelling. Betaalgegevens
        verwerkt onze betaalprovider; die zien wij niet.
      </p>
      <h2>Met wie we ze delen</h2>
      <p>
        Om je bestelling te kunnen leveren, geven we je naam, adres en telefoonnummer door aan
        onze leverancier en de vervoerder. De leverancier kan buiten de Europese Unie gevestigd
        zijn; we geven dan alleen door wat nodig is om je pakket te bezorgen. Betalingen lopen
        via Mollie (Nederland).
      </p>
      <h2>Bezoekstatistieken en cookies</h2>
      <p>
        We meten hoe de winkel wordt gebruikt met PostHog (EU-servers). Zonder jouw toestemming
        gebeurt dat anoniem en zonder cookies. Geef je toestemming in de cookiemelding, dan
        gebruiken we een cookie om bezoeken aan elkaar te koppelen.
      </p>
      {META_PIXEL_ID && (
        <>
          <h2>Advertenties (Meta)</h2>
          <p>
            We adverteren op Facebook en Instagram. Alleen als je in de cookiemelding op
            &quot;Accepteren&quot; klikt, laden we de Meta Pixel en sturen we bij een bestelling
            versleutelde (gehashte) contactgegevens en het bestelbedrag naar Meta Platforms Ireland.
            Zo kan Meta meten welke advertenties tot een aankoop leiden. Meta kan deze gegevens ook
            buiten de EU verwerken. Weiger je, dan gebeurt dit niet. Je keuze wijzigen: verwijder de
            cookies van deze site, dan vragen we het opnieuw.
          </p>
        </>
      )}
      <h2>Hoe lang</h2>
      <p>
        Bestelgegevens bewaren we 7 jaar, omdat de belastingwet dat vraagt. Overige gegevens
        verwijderen we zodra ze niet meer nodig zijn.
      </p>
      <h2>Jouw rechten</h2>
      <p>
        Je mag je gegevens inzien, laten corrigeren of laten verwijderen, en bezwaar maken.
        Mail ons daarvoor. Ben je het niet met ons eens, dan kun je een klacht indienen bij de
        Autoriteit Persoonsgegevens.
      </p>
      <CompanyDetails />
    </PolicyPage>
  )
}
