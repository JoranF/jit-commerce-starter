/**
 * Verwachte bezorgdatum in werkdagen (za/zo tellen niet mee). Gebruikt op de
 * productpagina ("Bestel je vandaag…") en op de pagina "Volg je bestelling".
 */
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from)
  let left = Math.max(0, Math.round(days))
  while (left > 0) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) left--
  }
  return d
}

const fmt = new Intl.DateTimeFormat("nl-NL", {
  weekday: "short",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Amsterdam",
})

/** "do 3 december" (zonder punt na de dag). */
export const shortDate = (d: Date) => fmt.format(d).replace(".", "")

/** "8–15" of "8" → { min: 8, max: 15 }; null als het geen getallen zijn. */
export function parseRange(range?: string | null): { min: number; max: number } | null {
  const nums = (range ?? "").match(/\d+/g)?.map(Number) ?? []
  if (!nums.length) return null
  return { min: Math.min(...nums), max: Math.max(...nums) }
}

/** Kerst-melding: eerlijk zeggen als het niet (zeker) vóór kerst lukt. */
export function christmasNotice(now: Date, earliest: Date, latest: Date): string | null {
  const year = now.getFullYear()
  const start = new Date(year, 10, 15) // 15 november
  const eve = new Date(year, 11, 24, 23, 59)
  if (now < start || now > eve) return null
  if (earliest > eve) return "Let op: bestel je nu, dan is hij niet meer vóór kerst in huis."
  if (latest > eve) return "Let op: bestel je nu, dan is hij misschien niet vóór kerst in huis."
  return null
}
