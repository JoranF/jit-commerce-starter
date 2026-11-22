import { HttpTypes } from "@medusajs/types"
import { buyAnchor, fillPolicy, store, type PolicyValues } from "@stores"
import ProductActions from "@modules/products/components/product-actions"
import { Suspense } from "react"
import BuyImage from "./buy-image"
import DeliveryEstimate from "./delivery-estimate"
import PaymentMethods from "./payment-methods"
import ProductSafety from "./product-safety"
import Promises from "./promises"
import { RatingLine } from "./reviews"

/**
 * Kopen op de homepage: foto, titel, prijs, knop, levertijd en de feiten.
 * Anker #<buyAnchor> (de knop in de hero scrolt hierheen).
 */
export default function Buy({
  product,
  region,
  values,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  values: PolicyValues
}) {
  const { buy } = store
  const availability = fillPolicy("In huis binnen {levertijd} werkdagen", values)

  // Beeld per variant (bv. "2 lampen" → foto met twee lampen), op variant-ID.
  const byVariant: Record<string, (typeof buy)["image"]> = {}
  for (const v of product.variants ?? []) {
    const value = v.options?.[0]?.value
    const img = value ? buy.optionImages?.[value] : undefined
    if (img) byVariant[v.id] = img
  }

  return (
    <section
      id={buyAnchor}
      className="scroll-mt-16 border-t border-brand-ink/10 bg-brand-light text-brand-ink"
      aria-labelledby="buy-title"
    >
      <div className="content-container grid gap-10 py-20 small:grid-cols-12 small:gap-16 small:py-32">
        <div className="small:col-span-6">
          {/* useSearchParams: Suspense zodat de pagina statisch kan blijven. */}
          <Suspense fallback={<BuyImage image={buy.image} byVariant={{}} />}>
            <BuyImage image={buy.image} byVariant={byVariant} />
          </Suspense>
        </div>

        <div className="small:col-span-5 small:col-start-8 small:self-center">
          <h2
            id="buy-title"
            className="font-display text-[clamp(2.1rem,4.2vw,3.4rem)] leading-[1.04] tracking-[-0.01em]"
          >
            {product.title || buy.title}
          </h2>
          {product.subtitle && (
            <p className="mt-3 text-lg text-brand-ink/75">{product.subtitle}</p>
          )}
          <div className="mt-3">
            <RatingLine />
          </div>

          <div className="mt-8 [&_[data-testid=product-price]]:text-2xl">
            <ProductActions
              product={product}
              region={region}
              availabilityText={availability}
              showAvailability={!availability}
            />
          </div>

          <DeliveryEstimate levertijd={values.levertijd} className="mt-5" />

          <Promises values={values} className="mt-8" />
          <PaymentMethods className="mt-6" />

          {buy.facts.length > 0 && (
            <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-base">
              {buy.facts.map((f) => (
                <div key={f.label} className="contents">
                  <dt className="text-brand-muted">{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <ProductSafety />
        </div>
      </div>
    </section>
  )
}
