import { Metadata } from "next"

import HomePage from "@modules/landing/templates/home-page"
import { listRegions } from "@lib/data/regions"
import { getSiteOrigin, listCountryCodes } from "@lib/util/site"
import { store } from "@stores"

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])

  return {
    title: { absolute: store.seo.title },
    description: store.seo.description,
    alternates: {
      canonical: `${origin}/${countryCode}`,
      languages: {
        ...Object.fromEntries(
          listCountryCodes(regions).map((code) => [
            `nl-${code.toUpperCase()}`,
            `${origin}/${code}`,
          ])
        ),
        "x-default": origin,
      },
    },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  return <HomePage countryCode={countryCode} />
}
