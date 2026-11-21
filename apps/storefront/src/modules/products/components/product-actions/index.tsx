"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { notifyCartUpdated } from "@lib/util/cart-events"
import { isVariantInStock } from "@lib/util/inventory"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname } from "next/navigation"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"
import { EVENTS, EXPERIMENTS } from "@lib/analytics/constants"
import { track, useExperiment } from "@modules/analytics/track"
import { store } from "@stores"
import { brandButton } from "./brand-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Knoptekst per variant van het experiment `pdp-cta-text`, uit de winkelconfig.
 * Let op: geen beloftes die niet kloppen (bv. "morgen in huis" bij dropshipping).
 */
const CTA_TEXT: Record<string, string> = store.buy.ctaText

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  /** Toon dit (bv. de levertijd) i.p.v. "Op voorraad" als de variant leverbaar is. */
  availabilityText?: string | null
  /** false = geen beschikbaarheidsregel (bv. als de levertijd er al onder staat). */
  showAvailability?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const getDefaultVariant = (product: HttpTypes.StoreProduct) =>
  product.variants?.find(isVariantInStock) ?? product.variants?.[0]

export default function ProductActions({
  product,
  disabled,
  availabilityText,
  showAvailability = true,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  // Preselected on the server so the form posts a valid variant without JavaScript.
  // The page is statically rendered, so `?v_id=` is applied after hydration.
  const [options, setOptions] = useState<Record<string, string | undefined>>(
    () => optionsAsKeymap(getDefaultVariant(product)?.options ?? null) ?? {}
  )
  const [isUrlVariantApplied, setIsUrlVariantApplied] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const countryCode = useParams().countryCode as string

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const variantId = new URLSearchParams(window.location.search).get("v_id")
    const variant = product.variants?.find((v) => v.id === variantId)
    if (variant) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: `?v_id=` can only be read after hydration (see above)
      setOptions(optionsAsKeymap(variant.options) ?? {})
    }
    setIsUrlVariantApplied(true)
  }, [product.variants])

  useEffect(() => {
    if (!isUrlVariantApplied) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
    // Sync the URL only when the selection changes: useRouter() can return a new
    // object after a navigation, which would re-run this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [selectedVariant, isValidVariant, isUrlVariantApplied])

  const inStock = useMemo(
    () => isVariantInStock(selectedVariant),
    [selectedVariant]
  )

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const { variant: ctaVariant, ready: ctaReady } = useExperiment(
    EXPERIMENTS.pdpCtaText
  )
  const ctaText = CTA_TEXT[ctaVariant] ?? CTA_TEXT.control

  // Experiment atc-flow: wat gebeurt er na "In winkelmand"?
  // control = bevestiging met een duidelijke knop "Afrekenen", test = meteen naar de checkout.
  const { variant: atcVariant } = useExperiment(EXPERIMENTS.atcFlow)

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)
    setAddError(null)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
    } catch {
      setAddError("Dat lukte niet. Probeer het nog een keer.")
      setIsAdding(false)
      return null
    }
    notifyCartUpdated()

    track(EVENTS.productAddedToCart, {
      product_id: product.id,
      product_name: product.title,
      variant_id: selectedVariant.id,
      sku: selectedVariant.sku,
      price: selectedVariant.calculated_price?.calculated_amount,
      currency: selectedVariant.calculated_price?.currency_code,
      quantity: 1,
      atc_flow: atcVariant,
    })

    if (atcVariant === "test") {
      // Laat de knop laden tot de checkout er is.
      router.push(`/${countryCode}/checkout`)
      return null
    }

    setAdded(true)
    setIsAdding(false)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleAddToCart()
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <form
          method="post"
          action={`/${countryCode}/cart/add`}
          onSubmit={handleSubmit}
          className="flex flex-col gap-y-2"
          {...{
            toolname: "add_to_cart",
            tooldescription:
              "Add the selected product variant to the shopping cart",
          }}
        >
          <input type="hidden" name="product_id" value={product.id} />
          <input
            type="hidden"
            name="variant_id"
            value={isValidVariant ? selectedVariant?.id ?? "" : ""}
          />
          <input type="hidden" name="quantity" value="1" />
          <div>
            {(product.variants?.length ?? 0) > 1 && (
              <div className="flex flex-col gap-y-4">
                {(product.options || []).map((option) => {
                  return (
                    <div key={option.id}>
                      <OptionSelect
                        option={option}
                        current={options[option.id]}
                        updateOption={setOptionValue}
                        title={option.title ?? ""}
                        name={`options[${option.id}]`}
                        data-testid="product-options"
                        disabled={!!disabled || isAdding}
                      />
                    </div>
                  )
                })}
                <Divider />
              </div>
            )}
          </div>

          <ProductPrice product={product} variant={selectedVariant} />

          {showAvailability && selectedVariant && isValidVariant && (
            <p
              className="text-small-regular text-ui-fg-subtle"
              data-testid="product-availability"
            >
              {inStock ? availabilityText || "Op voorraad" : "Uitverkocht"}
            </p>
          )}

          <Button
            type="submit"
            disabled={
              !inStock ||
              !selectedVariant ||
              !!disabled ||
              isAdding ||
              !isValidVariant
            }
            variant="primary"
            className={`w-full h-10 ${brandButton}`}
            isLoading={isAdding}
            data-testid="add-product-button"
          >
            {!selectedVariant
              ? "Kies een variant"
              : !inStock || !isValidVariant
              ? "Uitverkocht"
              : ctaReady
              ? ctaText
              : CTA_TEXT.control}
          </Button>
          {addError && (
            <p role="alert" className="text-small-regular text-rose-600">
              {addError}
            </p>
          )}
        </form>
        {added && (
          <div
            role="status"
            className="mt-2 flex flex-col gap-y-3 rounded-[2px] border border-current/15 p-4"
            data-testid="added-to-cart"
          >
            <p className="flex items-center gap-2 text-base">
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 10.5l3.5 3.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Toegevoegd aan je winkelmand
            </p>
            <LocalizedClientLink
              href="/checkout"
              className={`inline-flex h-10 w-full items-center justify-center rounded-md bg-ui-button-inverted text-ui-fg-on-inverted txt-compact-small-plus ${brandButton}`}
              data-testid="added-to-cart-checkout"
            >
              Afrekenen
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/cart"
              className="text-center text-small-regular underline underline-offset-4"
            >
              Bekijk winkelmand
            </LocalizedClientLink>
          </div>
        )}
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          added={added}
          ctaLabel={ctaReady ? ctaText : CTA_TEXT.control}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
