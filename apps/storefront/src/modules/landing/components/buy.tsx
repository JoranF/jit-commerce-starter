import { HttpTypes } from "@medusajs/types"
import { buyAnchor, fillPolicy, store, type PolicyValues } from "@stores"
import ProductActions from "@modules/products/components/product-actions"
import Image from "next/image"
import Promises from "./promises"

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

  return (
    <section
      id={buyAnchor}
      className="scroll-mt-16 border-t border-brand-ink/10 bg-brand-light text-brand-ink"
      aria-labelledby="buy-title"
    >
      <div className="content-container grid gap-10 py-20 small:grid-cols-12 small:gap-16 small:py-32">
        <div className="small:col-span-6">
          <div className="relative aspect-square overflow-hidden rounded-[2px] bg-brand-dark/10">
            <Image
              src={buy.image.src}
              alt={buy.image.alt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
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

          <div className="mt-8 [&_[data-testid=product-price]]:text-2xl">
            <ProductActions
              product={product}
              region={region}
              availabilityText={availability}
              showAvailability={!availability}
            />
          </div>

          <Promises values={values} className="mt-8" />

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
        </div>
      </div>
    </section>
  )
}
