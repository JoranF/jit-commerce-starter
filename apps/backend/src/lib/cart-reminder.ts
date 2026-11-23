/**
 * Welke winkelmanden krijgen een herinnering? Puur (getest in __tests__/cart-reminder.unit.spec.ts).
 *
 * Alleen als de klant er zelf om vroeg (`metadata.reminder_opt_in === true`, vinkje in de
 * checkout), met e-mailadres en producten, niet afgerekend, nog geen herinnering gehad, en
 * de laatste activiteit tussen 1 en 48 uur geleden (eerder is opdringerig, later zinloos).
 */
export type ReminderCart = {
  id: string
  email?: string | null
  completed_at?: string | Date | null
  updated_at?: string | Date | null
  metadata?: Record<string, unknown> | null
  items?: unknown[] | null
}

export const REMINDER_MIN_HOURS = 1
export const REMINDER_MAX_HOURS = 48

export function cartsToRemind<T extends ReminderCart>(carts: T[], now: Date): T[] {
  return carts.filter((c) => {
    const m = c.metadata ?? {}
    if (m.reminder_opt_in !== true || m.reminder_sent_at) return false
    if (!c.email || c.completed_at || !c.items?.length) return false
    const updated = c.updated_at ? new Date(c.updated_at).getTime() : NaN
    if (!Number.isFinite(updated)) return false
    const hours = (now.getTime() - updated) / 3_600_000
    return hours >= REMINDER_MIN_HOURS && hours <= REMINDER_MAX_HOURS
  })
}

/** Link die de winkelmand terugzet in de browser en naar de checkout gaat (storefront: /<land>/herstel/<id>). */
export const recoverUrl = (siteUrl: string, cartId: string, countryCode?: string | null) =>
  `${siteUrl}/${(countryCode || "nl").toLowerCase()}/herstel/${encodeURIComponent(cartId)}`
