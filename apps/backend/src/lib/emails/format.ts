/** Kleine helpers voor de e-mails: geld, datums, werkdagen, HTML-escaping. */

export const eur = (n: unknown, currency = "EUR") =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: currency.toUpperCase() }).format(
    Math.round(Number(n ?? 0) * 100) / 100
  )

export const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

/** Telt werkdagen op (za/zo tellen niet mee; feestdagen wel, dus ruim afronden). */
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from)
  let left = Math.max(0, Math.round(days))
  while (left > 0) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) {
      left--
    }
  }
  return d
}

const longDate = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Amsterdam",
})

export const formatDate = (d: Date) => longDate.format(d)

export type DeliveryPolicy = {
  handling_days_min?: number
  handling_days_max?: number
  transit_days_min?: number
  transit_days_max?: number
}

/**
 * "tussen donderdag 3 december en woensdag 9 december" op basis van het winkelbeleid
 * van de regio (verwerking + bezorging in werkdagen). null als het beleid ontbreekt.
 */
export function deliveryWindow(placedAt: Date, p?: DeliveryPolicy | null): string | null {
  if (!p || p.transit_days_max === undefined || p.handling_days_max === undefined) {
    return null
  }
  const min = Number(p.handling_days_min ?? 0) + Number(p.transit_days_min ?? 0)
  const max = Number(p.handling_days_max) + Number(p.transit_days_max)
  const a = formatDate(addBusinessDays(placedAt, min))
  const b = formatDate(addBusinessDays(placedAt, max))
  return a === b ? `op ${a}` : `tussen ${a} en ${b}`
}
