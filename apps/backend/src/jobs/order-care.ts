import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { formatDate, addBusinessDays } from "../lib/emails/format"
import { getBrand, sendEmail } from "../lib/emails/send"
import { orderInTransit, ownerCareDigest, type EmailOrder } from "../lib/emails/templates"
import { evaluateOrder, type CareIssue, type CareOrder } from "../lib/order-care"

/**
 * Dagelijkse nazorg (08:17 NL-tijd):
 * 1. Klant: één mail "je pakket is nog onderweg" zodra de vroegste verwachte datum
 *    voorbij is (scheelt "waar blijft mijn bestelling?"-mails en chargebacks).
 * 2. Winkelier: lijstje met bestellingen die aandacht vragen (CJ-fout, onbetaald in
 *    CJ, te laat verzonden, te lang onderweg) naar SHOP_OWNER_EMAIL en, als die
 *    gezet is, OPS_WEBHOOK_URL (Discord/Slack).
 */
export default async function orderCareJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const now = new Date()

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "status",
      "created_at",
      "metadata",
      "items.*",
      "shipping_address.*",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
      "fulfillments.canceled_at",
      "fulfillments.labels.*",
      "region.metadata",
    ],
    filters: { created_at: { $gte: new Date(now.getTime() - 60 * 86_400_000) } },
    pagination: { take: 500, order: { created_at: "DESC" } },
  })

  const brand = getBrand()
  const issues: CareIssue[] = []
  let mailed = 0
  type Row = Omit<CareOrder, "fulfillments"> &
    EmailOrder & {
      fulfillments?: {
        shipped_at?: string | null
        delivered_at?: string | null
        canceled_at?: string | null
        labels?: { tracking_url?: string | null }[] | null
      }[]
    }
  for (const order of data as unknown as Row[]) {
    const result = evaluateOrder(order, now)
    issues.push(...result.issues)
    if (!result.sendTransitMail) continue
    const shippedAt = order.fulfillments?.map((f) => f.shipped_at).find(Boolean)
    const transitMax = Number((order.region?.metadata as Record<string, unknown> | undefined)?.transit_days_max)
    const latest =
      shippedAt && Number.isFinite(transitMax) ? formatDate(addBusinessDays(new Date(shippedAt), transitMax)) : null
    await sendEmail(container, {
      to: order.email,
      template: "order-in-transit",
      email: orderInTransit(order, brand, {
        latest,
        trackingUrl: order.fulfillments?.flatMap((f) => f.labels ?? []).find((l) => l.tracking_url)?.tracking_url,
      }),
      resourceId: order.id,
      resourceType: "order",
      idempotencyKey: `order-in-transit-${order.id}`,
    })
    const orderModule = container.resolve(Modules.ORDER)
    await orderModule.updateOrders(order.id, {
      metadata: { ...((order.metadata ?? {}) as Record<string, unknown>), care_transit_mail_at: now.toISOString() },
    })
    mailed++
  }

  if (issues.length) {
    const owner = process.env.SHOP_OWNER_EMAIL
    if (owner) {
      await sendEmail(container, {
        to: owner,
        template: "owner-care-digest",
        email: ownerCareDigest(brand, issues, process.env.MEDUSA_BACKEND_URL),
        idempotencyKey: `owner-care-digest-${now.toISOString().slice(0, 10)}`,
      })
    }
    const hook = process.env.OPS_WEBHOOK_URL
    if (hook) {
      const text = `⚠️ ${brand.name}: bestellingen die aandacht vragen\n${issues.map((i) => `• ${i.message}`).join("\n")}`
      const body = /discord(app)?\.com/.test(hook) ? { content: text.slice(0, 1900) } : { text }
      await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(
        (e) => logger.warn(`[order-care] webhook mislukt: ${(e as Error).message}`)
      )
    }
  }
  logger.info(`[order-care] ${data.length} bestellingen bekeken, ${mailed} onderweg-mail(s), ${issues.length} aandachtspunt(en)`)
}

export const config = {
  name: "order-care",
  // 07:17 UTC ≈ 08:17 NL (winter)
  schedule: "17 7 * * *",
}
