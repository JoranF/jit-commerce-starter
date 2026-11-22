import { store } from "@stores"
import { getImageProps } from "next/image"
import type { CSSProperties } from "react"

const pick = (o?: { title?: string; lead?: string; cta?: string }) =>
  Object.fromEntries(
    Object.entries({ title: o?.title, lead: o?.lead, cta: o?.cta }).filter(([, v]) => !!v)
  )

/**
 * Hero: de muur bij schemering. Bij het laden "gaat de lamp aan" (CSS in
 * globals.css: .lamp-on / .rise). Breed beeld op desktop, staand beeld op mobiel.
 */
export default function Hero({
  price,
  angle,
}: {
  price?: string | null
  /** Advertentie-invalshoek (store.angles): andere kop/tekst, zelfde pagina. */
  angle?: string
}) {
  const override = angle ? store.angles?.[angle] : undefined
  const hero = { ...store.hero, ...pick(override) }
  const { wide, tall, lightOrigin } = hero

  const common = { alt: hero.tall.alt, sizes: "100vw" }
  // Met images.unoptimized geeft Next geen srcSet terug; dan is de src zelf de bron.
  const { props: wideProps } = getImageProps({ ...common, src: wide.src, width: wide.width, height: wide.height })
  const {
    props: { srcSet: tallSrcSet, ...img },
  } = getImageProps({ ...common, src: tall.src, width: tall.width, height: tall.height })
  const wideSet = wideProps.srcSet || wideProps.src
  const tallSet = tallSrcSet || img.src

  const vars = {
    "--lx": `${lightOrigin.tall.x}%`,
    "--ly": `${lightOrigin.tall.y}%`,
    "--lx-wide": `${lightOrigin.wide.x}%`,
    "--ly-wide": `${lightOrigin.wide.y}%`,
    "--pos": `${lightOrigin.tall.x}% ${lightOrigin.tall.y}%`,
    "--pos-wide": `${lightOrigin.wide.x}% ${lightOrigin.wide.y}%`,
  } as CSSProperties

  return (
    <section
      className="relative isolate flex min-h-[calc(100svh-4rem)] overflow-hidden bg-brand-dark text-brand-light small:min-h-[min(calc(100svh-4rem),58rem)]"
      style={vars}
      aria-labelledby="hero-title"
    >
      <picture>
        <source media="(min-width: 1024px)" srcSet={wideSet} />
        <source srcSet={tallSet} />
        <img
          {...img}
          alt={hero.tall.alt}
          fetchPriority="high"
          loading="eager"
          className="absolute inset-0 -z-20 h-full w-full object-cover [object-position:var(--pos)] small:[object-position:var(--pos-wide)]"
        />
      </picture>

      {/* De lamp gaat aan: van donker naar licht, vanuit de lamp. */}
      <div
        aria-hidden
        className="lamp-on -z-10 small:[--lx:var(--lx-wide)] small:[--ly:var(--ly-wide)]"
      />

      {/* Leesbaarheid van de tekst: onder op mobiel, links op desktop. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-dark/90 via-brand-dark/45 via-40% to-transparent to-70% small:bg-gradient-to-r small:from-brand-dark/80 small:via-brand-dark/35 small:via-45% small:to-transparent small:to-70%"
      />

      {/* pb-32 op mobiel: ruimte voor de vaste koopbalk onderin. */}
      <div className="content-container flex w-full flex-col justify-end pb-32 pt-32 small:justify-center small:pb-24">
        <div className="max-w-[34rem]">
          <h1
            id="hero-title"
            className="rise font-display text-[clamp(3rem,9vw,6.5rem)] leading-[0.95] tracking-[-0.015em] [text-wrap:balance] [--d:0.9s]"
          >
            {hero.title}
          </h1>
          <p className="rise mt-6 max-w-[32ch] text-lg leading-relaxed text-brand-light/85 small:text-xl [--d:1.15s]">
            {hero.lead}
          </p>
          <div className="rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 [--d:1.35s]">
            <a
              href="#lamp"
              className="inline-flex h-12 items-center rounded-full bg-brand-accent px-7 text-base font-medium text-brand-ink transition-colors hover:bg-brand-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
            >
              {hero.cta}
            </a>
            {price && <span className="text-lg text-brand-light/85">{price}</span>}
          </div>
        </div>
      </div>
    </section>
  )
}
