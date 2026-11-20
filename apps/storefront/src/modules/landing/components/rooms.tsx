import { store } from "@stores"
import Image from "next/image"

/**
 * Drie plekken in huis. Mobiel: horizontaal vegen (de volgende foto steekt een
 * stukje uit); desktop: drie kolommen.
 */
export default function Rooms() {
  const { rooms, imageNote } = store
  return (
    <section className="bg-brand-light pb-20 text-brand-ink small:pb-32" aria-labelledby="rooms-title">
      <div className="content-container">
        <h2
          id="rooms-title"
          className="font-display text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.04] tracking-[-0.01em]"
        >
          {rooms.title}
        </h2>
      </div>
      <ul className="no-scrollbar mt-10 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 small:content-container small:grid small:grid-cols-3 small:gap-8 small:overflow-visible">
        {rooms.items.map((room) => (
          <li key={room.title} className="w-[78%] shrink-0 snap-start small:w-auto">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-brand-dark/10">
              <Image
                src={room.image.src}
                alt={room.image.alt}
                fill
                sizes="(min-width: 1024px) 30vw, 78vw"
                className="object-cover"
              />
            </div>
            <h3 className="mt-5 font-display text-2xl leading-tight">{room.title}</h3>
            <p className="mt-2 max-w-[36ch] text-base leading-relaxed text-brand-ink/75">{room.body}</p>
          </li>
        ))}
      </ul>
      {imageNote && (
        <p className="content-container mt-8 text-sm text-brand-muted">{imageNote}</p>
      )}
    </section>
  )
}
