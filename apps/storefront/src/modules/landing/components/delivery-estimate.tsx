"use client"

import { addBusinessDays, christmasNotice, parseRange, shortDate } from "@lib/util/delivery-dates"
import { useEffect, useState } from "react"

/**
 * "Bestel je vandaag, dan is hij er tussen do 3 en wo 10 december." Concreter dan
 * "8–15 werkdagen" en eerlijk over kerst. Berekend in de browser (de pagina is
 * statisch, dus "vandaag" moet daar vandaan komen).
 */
export default function DeliveryEstimate({
  levertijd,
  className = "",
}: {
  /** Totale levertijd in werkdagen, bv. "8–15" (winkelbeleid van de regio). */
  levertijd?: string
  className?: string
}) {
  const [text, setText] = useState<{ when: string; notice: string | null } | null>(null)

  useEffect(() => {
    const range = parseRange(levertijd)
    if (!range) return
    const now = new Date()
    const a = addBusinessDays(now, range.min)
    const b = addBusinessDays(now, range.max)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- "vandaag" bestaat pas in de browser
    setText({
      when:
        range.min === range.max
          ? `Bestel je vandaag, dan is hij er op ${shortDate(a)}.`
          : `Bestel je vandaag, dan is hij er tussen ${shortDate(a)} en ${shortDate(b)}.`,
      notice: christmasNotice(now, a, b),
    })
  }, [levertijd])

  if (!text) return null
  return (
    <div className={className} data-testid="delivery-estimate">
      <p className="text-base">{text.when}</p>
      {text.notice && <p className="mt-1 text-sm text-brand-ink/75">{text.notice}</p>}
    </div>
  )
}
