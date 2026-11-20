import React, { Suspense } from "react"

import VariantImageGallery from "@modules/products/components/image-gallery/variant-image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import Gallery from "@modules/landing/components/gallery"
import Promises from "@modules/landing/components/promises"
import Faq from "@modules/landing/components/faq"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { TrackEvent } from "@modules/analytics/track"
import { EVENTS } from "@lib/analytics/constants"
import { getStorePolicies } from "@lib/data/store-policies"
import { policyValues } from "@lib/util/policy-values"
import { fillPolicy, store } from "@stores"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

/** Productpagina in de stijl van de winkel (winkel met één product). */
async function BrandProductTemplate({ product, region, countryCode }: ProductTemplateProps) {
  const { current } = await getStorePolicies(countryCode)
  const values = policyValues(current)
  const isMain = product.handle === store.productHandle
  const facts = isMain ? store.buy.facts : []
  const faq = store.faq.items
    .map((item) => ({ q: item.q, a: fillPolicy(item.a, values) }))
    .filter((item): item is { q: string; a: string } => !!item.a)

  return (
    <div className="bg-brand-light text-brand-ink">
      <div
        className="content-container grid gap-10 py-6 small:grid-cols-12 small:gap-16 small:py-16"
        data-testid="product-container"
      >
        <div className="small:col-span-7">
          <Gallery product={product} />
          {isMain && store.imageNote && (
            <p className="mt-4 text-sm text-brand-muted">{store.imageNote}</p>
          )}
        </div>

        <div className="flex flex-col small:sticky small:top-24 small:col-span-5 small:self-start">
          <h1
            className="font-display text-[clamp(2.3rem,4.5vw,3.6rem)] leading-[1.02] tracking-[-0.01em]"
            data-testid="product-title"
          >
            {product.title}
          </h1>
          {product.subtitle && <p className="mt-3 text-lg text-brand-ink/75">{product.subtitle}</p>}

          <div className="mt-8 [&_[data-testid=product-price]]:text-2xl">
            <ProductActions
              product={product}
              region={region}
              availabilityText={fillPolicy("In huis binnen {levertijd} werkdagen", values)}
              showAvailability={false}
            />
          </div>

          <Promises values={values} className="mt-8" />

          {product.description && (
            <div
              className="mt-8 flex flex-col gap-4 text-base leading-relaxed text-brand-ink/80"
              data-testid="product-description"
            >
              {product.description.split(/\n{2,}/).map((para) => (
                <p key={para.slice(0, 32)} className="max-w-[60ch]">
                  {para}
                </p>
              ))}
            </div>
          )}

          {facts.length > 0 && (
            <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 border-t border-brand-ink/10 pt-6 text-base">
              {facts.map((f) => (
                <div key={f.label} className="contents">
                  <dt className="text-brand-muted">{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
      {isMain && faq.length > 0 && <Faq title={store.faq.title} items={faq} />}
    </div>
  )
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const tracking = (
    <TrackEvent
      event={EVENTS.productViewed}
      properties={{
        product_id: product.id,
        product_name: product.title,
        handle: product.handle,
        collection: product.collection?.title,
        country: countryCode,
      }}
    />
  )

  if (!store.catalog) {
    return (
      <>
        {tracking}
        <BrandProductTemplate product={product} region={region} countryCode={countryCode} />
      </>
    )
  }

  return (
    <>
      {tracking}
      <div
        className="content-container  flex flex-col small:flex-row small:items-start py-6 relative"
        data-testid="product-container"
      >
        <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-6">
          <ProductInfo product={product} />
          <ProductTabs product={product} />
        </div>
        <div className="block w-full relative">
          <VariantImageGallery product={product} />
        </div>
        <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-12">
          <ProductOnboardingCta />
          <ProductActions product={product} region={region} />
        </div>
      </div>
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
