import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getBrand, sendEmail } from "../lib/emails/send"
import { orderCanceled, type EmailOrder } from "../lib/emails/templates"

/** Mail aan de klant als een bestelling geannuleerd wordt (in de admin). */
export default async function emailOrderCanceled({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  try {
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "email", "shipping_address.*"],
      filters: { id: data.id },
    })
    if (!order) {
      return
    }
    await sendEmail(container, {
      to: order.email,
      template: "order-canceled",
      email: orderCanceled(order as unknown as EmailOrder, getBrand()),
      resourceId: order.id,
      resourceType: "order",
      idempotencyKey: `order-canceled-${order.id}`,
    })
  } catch (e) {
    logger.warn(`[email] annuleringsmail ${data.id} mislukt: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
