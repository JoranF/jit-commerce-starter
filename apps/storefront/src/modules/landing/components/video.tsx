import { store } from "@stores"

/**
 * De lamp in beweging: een korte video (aan in een donkere kamer). Speelt stil en
 * in een lus, zoals op Instagram. Met "minder beweging" toont de browser alleen de
 * poster (geen autoplay). Alleen als store.video gezet is.
 */
export default function Video() {
  const v = store.video
  if (!v) return null
  return (
    <section className="bg-brand-dark py-20 text-brand-light small:py-32" aria-labelledby="video-title">
      <div className="content-container grid gap-10 small:grid-cols-12 small:items-center small:gap-16">
        <div className="small:col-span-5">
          <h2
            id="video-title"
            className="font-display text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.04] tracking-[-0.01em]"
          >
            {v.title}
          </h2>
          {v.body && <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-brand-light/80">{v.body}</p>}
        </div>
        <div
          className="relative overflow-hidden rounded-[2px] small:col-span-6 small:col-start-7"
          style={{ aspectRatio: String(v.aspect ?? 4 / 5) }}
        >
          <video
            className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
            src={v.src}
            poster={v.poster.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={v.poster.alt}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- poster als stilstaand beeld bij "minder beweging" */}
          <img
            src={v.poster.src}
            alt={v.poster.alt}
            className="absolute inset-0 hidden h-full w-full object-cover motion-reduce:block"
          />
        </div>
      </div>
    </section>
  )
}
