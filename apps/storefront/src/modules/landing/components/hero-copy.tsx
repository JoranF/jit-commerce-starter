"use client"

import type { ExperimentKey } from "@lib/analytics/constants"
import { useTimedExperiment } from "@modules/analytics/use-timed-experiment"
import { buyAnchor } from "@stores"

type Copy = { title: string; lead: string; cta: string }

/**
 * Tekst van de hero. Met het experiment hero-copy krijgt de helft van de bezoekers
 * een andere kop. De tekst komt pas na 0,9 s in beeld (intro-animatie), dus de
 * variant wisselt onzichtbaar; is hij er dan nog niet, dan blijft het control.
 */
export default function HeroCopy({
  copy,
  test,
  price,
  trust,
}: {
  copy: Copy
  /** store.experimentContent.heroCopy; weglaten = geen test. */
  test?: { flag: string; test: Partial<Copy> }
  price?: string | null
  trust?: string[]
}) {
  const variant = useTimedExperiment((test?.flag ?? "hero-copy") as ExperimentKey, 800, !!test)
  const c = variant === "test" && test ? { ...copy, ...test.test } : copy

  return (
    <div className="max-w-[34rem]">
      <h1
        id="hero-title"
        className="rise font-display text-[clamp(2.6rem,11vw,6.5rem)] leading-[0.95] tracking-[-0.015em] [text-wrap:balance] [--d:0.9s] small:text-[clamp(3rem,9vw,6.5rem)]"
      >
        {c.title}
      </h1>
      <p className="rise mt-4 max-w-[34ch] text-base leading-relaxed text-brand-light/85 small:mt-6 small:max-w-[32ch] small:text-xl [--d:1.15s]">
        {c.lead}
      </p>
      <div className="rise mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 small:mt-9 [--d:1.35s]">
        <a
          href={`#${buyAnchor}`}
          className="inline-flex h-12 items-center rounded-full bg-brand-accent px-7 text-base font-medium text-brand-ink transition-colors hover:bg-brand-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
        >
          {c.cta}
        </a>
        {price && <span className="text-lg text-brand-light/85">{price}</span>}
      </div>
      {trust && trust.length > 0 && (
        <ul className="rise mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-light/80 [--d:1.5s]" aria-label="Voordelen">
          {trust.map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 10.5l3.5 3.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
