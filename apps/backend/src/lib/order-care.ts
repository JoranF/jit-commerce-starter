/**
 * Nazorg per bestelling (job order-care, dagelijks). Pure logica, getest in
 * __tests__/order-care.unit.spec.ts. Dropshipping heeft een lange levertijd; de
 * meeste klachten ("waar blijft mijn bestelling?", chargebacks) ontstaan door
 * stilte. Daarom:
 * - klant: één geruststellende mail als de vroegste verwachte datum voorbij is en
 *   het pakket nog onderweg is;
 * - winkelier: een dagelijks lijstje met bestellingen die aandacht nodig hebben.
 */

export type CarePolicy = {
  handling_days_max?: number
  transit_days_min?: number
  transit_days_max?: number
}

export type CareOrder = {
  id: string
  display_id?: number | string | null
  created_at: string | Date
  status?: string | null
  metadata?: Record<string, unknown> | null
  fulfillments?: { shipped_at?: string | Date | null; delivered_at?: string | Date | null; canceled_at?: string | Date | null }[] | null
  region?: { metadata?: Record<string, unknown> | null } | null
}

export type CareIssue = {
  order_id: string
  display_id?: number | string | null
  kind: "cj_error" | "cj_unpaid" | "not_shipped" | "late_delivery"
  message: string
}

/** Aantal werkdagen (ma–vr) tussen twee momenten. */
export function businessDaysBetween(from: Date, to: Date): number {
  if (to <= from) return 0
  let days = 0
  const d = new Date(from)
  d.setHours(12, 0, 0, 0)
  const end = new Date(to)
  end.setHours(12, 0, 0, 0)
  while (d < end) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) days++
  }
  return days
}

const num = (v: unknown, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function evaluateOrder(order: CareOrder, now: Date): { issues: CareIssue[]; sendTransitMail: boolean } {
  const issues: CareIssue[] = []
  if (order.status === "canceled") return { issues, sendTransitMail: false }

  const meta = (order.metadata ?? {}) as Record<string, unknown>
  const policy = (order.region?.metadata ?? {}) as CarePolicy
  const handlingMax = num(policy.handling_days_max, 3)
  const transitMin = num(policy.transit_days_min, 5)
  const transitMax = num(policy.transit_days_max, 12)
  const created = new Date(order.created_at)
  const hoursOld = (now.getTime() - created.getTime()) / 3_600_000
  const no = `#${order.display_id ?? order.id}`
  const add = (kind: CareIssue["kind"], message: string) =>
    issues.push({ order_id: order.id, display_id: order.display_id, kind, message })

  const fulfillments = (order.fulfillments ?? []).filter((f) => !f.canceled_at)
  const shippedAt = fulfillments.map((f) => f.shipped_at).find(Boolean)
  const delivered = fulfillments.some((f) => f.delivered_at) || meta.cj_status === "delivered"
  const cjStatus = typeof meta.cj_status === "string" ? meta.cj_status : undefined

  if (cjStatus === "error" || cjStatus === "blocked") {
    add("cj_error", `${no}: niet doorgestuurd naar CJ (${String(meta.cj_error ?? cjStatus).slice(0, 160)})`)
  } else if (cjStatus === "awaiting_payment") {
    const since = meta.cj_forwarded_at ? new Date(String(meta.cj_forwarded_at)) : created
    if ((now.getTime() - since.getTime()) / 3_600_000 >= 12) {
      add("cj_unpaid", `${no}: staat al ${Math.floor((now.getTime() - since.getTime()) / 3_600_000)} uur onbetaald in CJ. Betaal hem in je CJ-dashboard.`)
    }
  }

  if (!shippedAt && !delivered && hoursOld > 2) {
    const bd = businessDaysBetween(created, now)
    if (bd > handlingMax + 2) {
      add("not_shipped", `${no}: na ${bd} werkdagen nog niet verzonden (normaal max. ${handlingMax}).`)
    }
  }

  let sendTransitMail = false
  if (shippedAt && !delivered) {
    const bd = businessDaysBetween(new Date(shippedAt), now)
    if (bd > transitMax + 3) {
      add("late_delivery", `${no}: ${bd} werkdagen onderweg (normaal max. ${transitMax}). Check de track & trace en mail de klant.`)
    }
    sendTransitMail = bd >= transitMin && !meta.care_transit_mail_at
  }
  return { issues, sendTransitMail }
}
