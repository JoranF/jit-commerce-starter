import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { cartsToRemind, recoverUrl, REMINDER_MAX_HOURS } from "../lib/cart-reminder"
import { getBrand, sendEmail } from "../lib/emails/send"
import { cartReminder } from "../lib/emails/templates"

/**
 * Elk uur: één herinnering aan klanten die hun bestelling niet afrondden en daar zelf om
 * vroegen (vinkje in de checkout). Daarna nooit meer voor dezelfde winkelmand.
 * Zonder winkel-URL (STORE_URL of STORE_CORS) gebeurt er niets: dan klopt de link niet.
 */
export default async function cartReminderJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const brand = getBrand()
  if (!brand.siteUrl) return
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const now = new Date()
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "currency_code",
      "total",
      "completed_at",
      "updated_at",
      "metadata",
      "items.*",
      "shipping_address.first_name",
      "shipping_address.country_code",
    ],
    filters: { updated_at: { $gte: new Date(now.getTime() - REMINDER_MAX_HOURS * 3_600_000) } },
    pagination: { take: 500 },
  })

  const cartModule = container.resolve(Modules.CART)
  let sent = 0
  for (const cart of cartsToRemind(data as any[], now)) {
    // Eerst markeren: liever een gemiste herinnering dan een dubbele.
    await cartModule.updateCarts(cart.id, { metadata: { ...(cart.metadata ?? {}), reminder_sent_at: now.toISOString() } })
    await sendEmail(container, {
      to: cart.email,
      template: "cart-reminder",
      email: cartReminder(cart, brand, recoverUrl(brand.siteUrl, cart.id, cart.shipping_address?.country_code)),
      resourceId: cart.id,
      resourceType: "cart",
      idempotencyKey: `cart-reminder-${cart.id}`,
    })
    sent++
  }
  if (sent) logger.info(`[cart-reminder] ${sent} herinnering(en) verstuurd`)
}

export const config = {
  name: "cart-reminder",
  schedule: "23 * * * *",
}
