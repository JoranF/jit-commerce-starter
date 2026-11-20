import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

const altFor = (product: HttpTypes.StoreProduct, image: HttpTypes.StoreProductImage, i: number) =>
  (typeof image.metadata?.alt === "string" && image.metadata.alt) ||
  `${product.title}, foto ${i + 1}`

/**
 * Productfoto's. Mobiel: vegen (de volgende foto steekt uit), zodat de koopknop
 * niet onder vijf grote foto's verdwijnt. Desktop: eerste foto groot, de rest
 * in twee kolommen. Alt-tekst uit image.metadata.alt (gezet door het setup-script).
 */
export default function Gallery({ product }: { product: HttpTypes.StoreProduct }) {
  const images = (product.images ?? []).filter((img) => !!img.url)
  if (!images.length) {
    return <div className="aspect-square w-full rounded-[2px] bg-brand-dark/10" />
  }

  return (
    <>
      <ul
        className="no-scrollbar -mx-6 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 small:hidden"
        aria-label="Productfoto's"
      >
        {images.map((img, i) => (
          <li key={img.id} className="w-[86%] shrink-0 snap-start">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-brand-dark/10">
              <Image
                src={img.url!}
                alt={altFor(product, img, i)}
                fill
                sizes="86vw"
                priority={i === 0}
                className="object-cover"
              />
            </div>
          </li>
        ))}
      </ul>

      <ul className="hidden grid-cols-2 gap-4 small:grid" aria-label="Productfoto's">
        {images.map((img, i) => (
          <li
            key={img.id}
            className={i === 0 ? "col-span-2" : undefined}
          >
            <div
              className={`relative overflow-hidden rounded-[2px] bg-brand-dark/10 ${
                i === 0 ? "aspect-square" : "aspect-[4/5]"
              }`}
            >
              <Image
                src={img.url!}
                alt={altFor(product, img, i)}
                fill
                sizes={i === 0 ? "55vw" : "28vw"}
                priority={i === 0}
                className="object-cover"
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
