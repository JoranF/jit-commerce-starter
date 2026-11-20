import { store } from "@stores"
import Image from "next/image"

/** Wat het is, in twee zinnen, naast een close-up van de reflector. */
export default function Intro() {
  const { intro } = store
  return (
    <section className="bg-brand-light text-brand-ink" aria-labelledby="intro-title">
      <div className="content-container grid gap-10 py-20 small:grid-cols-12 small:items-center small:gap-16 small:py-32">
        <div className="small:col-span-6 small:col-start-1">
          <h2
            id="intro-title"
            className="font-display text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.04] tracking-[-0.01em]"
          >
            {intro.title}
          </h2>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-brand-ink/80">
            {intro.body}
          </p>
        </div>
        <div className="relative aspect-square overflow-hidden rounded-[2px] small:col-span-5 small:col-start-8">
          <Image
            src={intro.image.src}
            alt={intro.image.alt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
