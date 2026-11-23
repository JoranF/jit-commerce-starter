import { store } from "@stores"
import HeroCopy from "./hero-copy"
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

  // Mobiel: beeld onderaan uitlijnen, zodat de lamp hoger in beeld staat en de kop
  // eronder past (anders staat de tekst over de lamp heen). Waar de lamp dan staat
  // hangt af van de schermverhouding: min(y%, 100% − (1 − y) × beeldhoogte), met
  // beeldhoogte = 100vw / (breedte/hoogte) zolang het beeld op de breedte schaalt.
  const tallY = lightOrigin.tall.y
  const tallShift = (((100 - tallY) / 100) * (tall.height / tall.width) * 100).toFixed(2)
  const vars = {
    "--lx": `${lightOrigin.tall.x}%`,
    "--ly": `min(${tallY}%, calc(100% - ${tallShift}vw))`,
    "--lx-wide": `${lightOrigin.wide.x}%`,
    "--ly-wide": `${lightOrigin.wide.y}%`,
    "--pos": `${lightOrigin.tall.x}% 100%`,
    "--pos-wide": `${lightOrigin.wide.x}% ${lightOrigin.wide.y}%`,
  } as CSSProperties

  return (
    <section
      className="relative isolate flex min-h-[calc(100svh-4rem)] overflow-hidden bg-brand-dark text-brand-light small:min-h-[min(calc(100svh-4rem),58rem)]"
      style={vars}
      aria-labelledby="hero-title"
      // De vaste koopbalk op mobiel blijft weg zolang de hero in beeld is (die heeft zijn eigen knop).
      data-hero
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

      {/* De lamp gaat aan: van donker naar licht, vanuit de lamp (store.hero.glow). */}
      {store.hero.glow !== false && (
        <div
          aria-hidden
          className="lamp-on -z-10 small:[--lx:var(--lx-wide)] small:[--ly:var(--ly-wide)]"
        />
      )}

      {/* Leesbaarheid van de tekst: onder op mobiel, links op desktop. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-dark/90 via-brand-dark/45 via-40% to-transparent to-70% small:bg-gradient-to-r small:from-brand-dark/80 small:via-brand-dark/35 small:via-45% small:to-transparent small:to-70%"
      />

      <div className="content-container flex w-full flex-col justify-end pb-10 pt-32 small:justify-center small:pb-24">
        <HeroCopy
          copy={{ title: hero.title, lead: hero.lead, cta: hero.cta }}
          // Geen kop-test op advertentiepagina's (/a/<angle>): daar hoort de kop bij de advertentie.
          test={override ? undefined : store.experimentContent?.heroCopy}
          price={price}
          trust={hero.trust}
        />
      </div>
    </section>
  )
}
