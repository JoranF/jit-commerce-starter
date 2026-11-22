import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import LandingTemplate from "@modules/landing/templates"
import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { getStorePolicies } from "@lib/data/store-policies"
import { policyValues } from "@lib/util/policy-values"
import { toJsonLd } from "@lib/util/product-structured-data"
import { getSiteOrigin, STORE_NAME } from "@lib/util/site"
import { buildRegionsReturnPolicies } from "@lib/util/store-policies"
import { store } from "@stores"

/**
 * De homepage. Bij een winkel met één product is dat de landingspagina, optioneel
 * met een advertentie-invalshoek (`angle`, zie store.angles en /[countryCode]/a/[angle]).
 */
export default async function HomePage({
  countryCode,
  angle,
}: {
  countryCode: string
  angle?: string
}) {
  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])
  const homeUrl = `${origin}/${countryCode}`
  const returnPolicies = buildRegionsReturnPolicies(regions)
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: STORE_NAME,
      url: origin,
      ...(returnPolicies.length
        ? { hasMerchantReturnPolicy: returnPolicies }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: STORE_NAME,
      url: homeUrl,
      inLanguage: "nl-NL",
      ...(store.catalog
        ? {
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${homeUrl}/search?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          }
        : {}),
    },
  ]

  const jsonLd = (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
    />
  )

  // Winkel met één product: de homepage is de landingspagina van dat product.
  if (!store.catalog) {
    const [product, { current }] = await Promise.all([
      listProducts({
        countryCode,
        queryParams: { handle: store.productHandle },
      }).then(({ response }) => response.products[0] ?? null),
      getStorePolicies(countryCode),
    ])

    return (
      <>
        {jsonLd}
        <LandingTemplate
          product={product}
          region={region}
          values={policyValues(current)}
          angle={angle}
        />
      </>
    )
  }

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections) {
    return null
  }

  return (
    <>
      {jsonLd}
      <Hero />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
