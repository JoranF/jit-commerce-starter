"use client"

import { m } from "motion/react"
import { useId, useState } from "react"
import { duration, ease } from "@modules/common/components/motion"

export type FaqItem = { q: string; a: string }

/**
 * Veelgestelde vragen. Alle antwoorden staan in de HTML (vindbaar voor Google);
 * dichte antwoorden zijn verborgen (hoogte 0, inert). Openklappen animeert met
 * Motion; met "minder beweging" gaat het zonder animatie.
 */
export default function Faq({ title, items }: { title: string; items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)
  const base = useId()

  return (
    <section
      id="vragen"
      className="scroll-mt-16 border-t border-brand-ink/10 bg-brand-light text-brand-ink"
      aria-labelledby={`${base}-title`}
    >
      <div className="content-container grid gap-10 py-20 small:grid-cols-12 small:gap-16 small:py-32">
        <h2
          id={`${base}-title`}
          className="font-display text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.04] tracking-[-0.01em] small:col-span-4"
        >
          {title}
        </h2>
        <ul className="divide-y divide-brand-ink/10 border-y border-brand-ink/10 small:col-span-7 small:col-start-6">
          {items.map((item, i) => {
            const isOpen = open === i
            const panelId = `${base}-panel-${i}`
            return (
              <li key={item.q}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left text-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
                  >
                    {item.q}
                    <m.span
                      aria-hidden
                      initial={false}
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: duration.fast, ease }}
                      className="text-2xl font-light leading-none text-brand-muted"
                    >
                      +
                    </m.span>
                  </button>
                </h3>
                <m.div
                  id={panelId}
                  role="region"
                  aria-label={item.q}
                  initial={false}
                  animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={{ duration: duration.base, ease }}
                  inert={!isOpen}
                  className="overflow-hidden"
                >
                  <p className="max-w-[60ch] pb-6 text-base leading-relaxed text-brand-ink/80">
                    {item.a}
                  </p>
                </m.div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
