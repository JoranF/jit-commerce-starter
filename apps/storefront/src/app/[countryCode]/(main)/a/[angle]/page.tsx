import { Metadata } from "next"
import { notFound } from "next/navigation"

import HomePage from "@modules/landing/templates/home-page"
import { getSiteOrigin } from "@lib/util/site"
import { store } from "@stores"

/**
 * Landingspagina voor een advertentie-invalshoek (store.angles). Bezoekers zien
 * gewoon /<land>?angle=<key>: de middleware herschrijft dat hierheen, zodat de
 * pagina statisch blijft (gerenderd bij het eerste bezoek, daarna uit de cache)
 * en er niets verspringt. Onbekende angle = 404. Niet indexeren: canonical is
 * de homepage.
 */
export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string; angle: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const origin = await getSiteOrigin()
  return {
    title: { absolute: store.seo.title },
    description: store.seo.description,
    alternates: { canonical: `${origin}/${countryCode}` },
    robots: { index: false, follow: true },
  }
}

export default async function AnglePage(props: {
  params: Promise<{ countryCode: string; angle: string }>
}) {
  const { countryCode, angle } = await props.params
  if (!store.angles?.[angle]) notFound()
  return <HomePage countryCode={countryCode} angle={angle} />
}
