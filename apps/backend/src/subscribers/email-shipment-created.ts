import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getBrand, sendEmail } from "../lib/emails/send"
import { orderShipped, type EmailOrder } from "../lib/emails/templates"
import type { DeliveryPolicy } from "../lib/emails/format"

/**
 * "Je bestelling is onderweg" met de track & trace. Komt vanzelf zodra CJ een
 * trackingnummer heeft (job cj-sync maakt dan de verzending aan), of als je in de
 * admin een verzending met trackingnummer aanmaakt.
 */
export default async function emailShipmentCreated({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (data.no_notification) {
    return
  }
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  try {
    const {
      data: [fulfillment],
    } = await query.graph({
      entity: "fulfillment",
      fields: [
        "id",
        "shipped_at",
        "labels.*",
        "order.id",
        "order.display_id",
        "order.email",
        "order.currency_code",
        "order.items.*",
        "order.shipping_address.*",
        "order.region.metadata",
      ],
      filters: { id: data.id },
    })
    const order = (fulfillment as unknown as { order?: EmailOrder & { region?: { metadata?: Record<string, unknown> | null } } })
      ?.order
    if (!order) {
      return
    }
    const labels = ((fulfillment as unknown as { labels?: { tracking_number?: string; tracking_url?: string }[] })
      .labels ?? []) as { tracking_number?: string; tracking_url?: string }[]
    await sendEmail(container, {
      to: order.email,
      template: "order-shipped",
      email: orderShipped(order, getBrand(), {
        tracking: labels.map((l) => ({ number: l.tracking_number, url: l.tracking_url })),
        policy: (order.region?.metadata ?? null) as DeliveryPolicy | null,
        shippedAt: (fulfillment as unknown as { shipped_at?: string | Date | null }).shipped_at
          ? new Date((fulfillment as unknown as { shipped_at: string }).shipped_at)
          : new Date(),
      }),
      resourceId: order.id,
      resourceType: "order",
      idempotencyKey: `order-shipped-${data.id}`,
    })
  } catch (e) {
    logger.warn(`[email] verzendmail ${data.id} mislukt: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
