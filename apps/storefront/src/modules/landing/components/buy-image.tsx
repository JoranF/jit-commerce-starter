"use client"

import type { StoreImage } from "@stores"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

/**
 * Beeld in het koopblok. Wisselt mee met de gekozen variant (`?v_id=`, gezet door
 * ProductActions), bv. "2 lampen" → de foto met twee lampen (store.buy.optionImages).
 */
export default function BuyImage({
  image,
  byVariant,
}: {
  image: StoreImage
  byVariant: Record<string, StoreImage>
}) {
  const variantId = useSearchParams().get("v_id")
  const current = (variantId && byVariant[variantId]) || image
  const all = [image, ...Object.values(byVariant).filter((i) => i.src !== image.src)]

  return (
    <div className="relative aspect-square overflow-hidden rounded-[2px] bg-brand-dark/10">
      {/* Alle beelden staan klaar; alleen de gekozen is zichtbaar (geen laadflits bij wisselen). */}
      {all.map((img, i) => (
        <Image
          key={img.src}
          src={img.src}
          alt={img.alt}
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          className={`object-cover transition-opacity duration-500 motion-reduce:transition-none ${
            img.src === current.src ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={img.src !== current.src}
          loading={i === 0 ? undefined : "lazy"}
        />
      ))}
    </div>
  )
}
