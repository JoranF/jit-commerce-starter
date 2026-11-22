import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getBrand, sendEmail } from "../lib/emails/send"
import {
  orderConfirmation,
  ownerNewOrder,
  type ConfirmationPolicy,
  type EmailOrder,
} from "../lib/emails/templates"

/**
 * Orderbevestiging aan de klant (verplicht bij verkoop op afstand: bedrijfsgegevens,
 * prijs, levertijd, herroepingsrecht) en een melding aan de winkelier
 * (SHOP_OWNER_EMAIL). Verstuurd via de e-mailprovider (RESEND_API_KEY/BREVO_API_KEY);
 * zonder provider logt Medusa de mail alleen.
 */
export default async function emailOrderPlaced({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  try {
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "created_at",
        "total",
        "subtotal",
        "item_total",
        "shipping_total",
        "discount_total",
        "tax_total",
        "items.*",
        "shipping_methods.*",
        "shipping_address.*",
        "region.metadata",
        "cart.metadata",
      ],
      filters: { id: data.id },
    })
    if (!order) {
      return
    }
    const brand = getBrand()
    const o = order as unknown as EmailOrder & {
      region?: { metadata?: Record<string, unknown> | null }
      cart?: { metadata?: Record<string, unknown> | null }
    }
    const policy = (o.region?.metadata ?? null) as ConfirmationPolicy | null

    await sendEmail(container, {
      to: o.email,
      template: "order-confirmation",
      email: orderConfirmation(o, brand, { policy }),
      resourceId: o.id,
      resourceType: "order",
      idempotencyKey: `order-confirmation-${o.id}`,
    })

    const owner = process.env.SHOP_OWNER_EMAIL
    if (owner) {
      const ad = Object.fromEntries(
        Object.entries(o.cart?.metadata ?? {}).filter(([k]) => k.startsWith("ad_"))
      )
      await sendEmail(container, {
        to: owner,
        template: "owner-new-order",
        email: ownerNewOrder(o, brand, {
          adminUrl: process.env.MEDUSA_BACKEND_URL,
          ad,
          cjAutoPay: process.env.CJ_API_KEY ? process.env.CJ_AUTO_PAY === "true" : undefined,
        }),
        resourceId: o.id,
        resourceType: "order",
        idempotencyKey: `owner-new-order-${o.id}`,
      })
    }
  } catch (e) {
    logger.warn(`[email] orderbevestiging ${data.id} mislukt: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
