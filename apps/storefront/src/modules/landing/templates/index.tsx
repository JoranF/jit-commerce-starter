import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import { toJsonLd } from "@lib/util/product-structured-data"
import { buyAnchor, fillPolicy, store, type PolicyValues } from "@stores"
import Buy from "../components/buy"
import Faq from "../components/faq"
import Hero from "../components/hero"
import Intro from "../components/intro"
import Reviews from "../components/reviews"
import Rooms from "../components/rooms"
import Video from "../components/video"
import { EVENTS } from "@lib/analytics/constants"
import { TrackEvent } from "@modules/analytics/track"
import TrackInView from "@modules/analytics/track-in-view"

/**
 * Homepage van een winkel met één product (store.catalog === false):
 * hero → wat het is → waar het past → kopen → vragen.
 */
export default function LandingTemplate({
  product,
  region,
  values,
  angle,
}: {
  product: HttpTypes.StoreProduct | null
  region: HttpTypes.StoreRegion
  values: PolicyValues
  /** Advertentie-invalshoek (store.angles), via /<land>/a/<angle>. */
  angle?: string
}) {
  const price = product ? getProductPrice({ product }).cheapestPrice?.calculated_price : null

  // Vragen met een termijn die (nog) niet in het winkelbeleid staat, vallen weg.
  const faq = store.faq.items
    .map((item) => ({ q: item.q, a: fillPolicy(item.a, values) }))
    .filter((item): item is { q: string; a: string } => !!item.a)

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(faqJsonLd) }}
      />
      {product && (
        <TrackEvent
          event={EVENTS.productViewed}
          properties={{
            product_id: product.id,
            product_name: product.title,
            handle: product.handle,
            page: "landing",
            landing_angle: angle ?? "standaard",
            price,
          }}
        />
      )}
      <Hero price={price} angle={angle} />
      <Intro />
      <Video />
      <Rooms />
      {product ? (
        <TrackInView
          event={EVENTS.buySectionViewed}
          properties={{ product_id: product.id, product_name: product.title }}
        >
          <Buy product={product} region={region} values={values} />
        </TrackInView>
      ) : (
        // Product ontbreekt in Medusa (handle store.productHandle): maak het aan met
        // `medusa exec ./src/scripts/stores/setup-store.ts` in de backend.
        <section id={buyAnchor} className="border-t border-brand-ink/10 bg-brand-light py-20 text-brand-ink">
          <p className="content-container text-lg">{store.productLabel} is binnenkort te bestellen.</p>
        </section>
      )}
      <Reviews />
      {faq.length > 0 && <Faq title={store.faq.title} items={faq} />}
    </>
  )
}
