import { Metadata } from "next"
import { STORE_NAME } from "@lib/util/site"
import { CompanyDetails, PlaceholderNotice, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  // Staat het bedrijfsadres op: wel bereikbaar via de site, niet in zoekmachines.
  robots: { index: false, follow: true },
  title: "Contact",
  description: `Contact met ${STORE_NAME}.`,
}

export default function ContactPage() {
  return (
    <PolicyPage title="Contact">
      <PlaceholderNotice />
      <p>
        Een vraag over je bestelling, de levering of een retour? Mail ons en zet je
        bestelnummer erbij. We reageren zo snel mogelijk.
      </p>
      <CompanyDetails />
    </PolicyPage>
  )
}
