import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { getBrand } from "../lib/emails/send"
import {
  orderCanceled,
  orderConfirmation,
  orderShipped,
  ownerNewOrder,
  type ConfirmationPolicy,
  type EmailOrder,
} from "../lib/emails/templates"

/**
 * Bekijk de e-mails van een echte bestelling zonder iets te versturen:
 *   pnpm medusa exec ./src/scripts/preview-emails.ts [order_id]
 * Zonder order_id: de nieuwste bestelling. Schrijft HTML naar ./email-previews/.
 */
export default async function previewEmails({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
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
    filters: args?.[0] ? { id: args[0] } : {},
    pagination: { take: 1, order: { created_at: "DESC" } },
  })
  const order = orders[0] as unknown as
    | (EmailOrder & { region?: { metadata?: Record<string, unknown> | null } })
    | undefined
  if (!order) {
    logger.warn("Geen bestelling gevonden.")
    return
  }
  const brand = getBrand()
  const policy = (order.region?.metadata ?? null) as ConfirmationPolicy | null
  const mails = {
    "1-bevestiging": orderConfirmation(order, brand, { policy }),
    "2-onderweg": orderShipped(order, brand, {
      tracking: [{ number: "LP000000000CN", url: "https://t.17track.net/en#nums=LP000000000CN" }],
      policy,
    }),
    "3-geannuleerd": orderCanceled(order, brand),
    "4-melding-winkelier": ownerNewOrder(order, brand, { adminUrl: process.env.MEDUSA_BACKEND_URL }),
  }
  const dir = path.resolve(process.cwd(), "email-previews")
  await mkdir(dir, { recursive: true })
  for (const [name, mail] of Object.entries(mails)) {
    await writeFile(path.join(dir, `${name}.html`), mail.html)
    await writeFile(path.join(dir, `${name}.txt`), `Onderwerp: ${mail.subject}\n\n${mail.text}`)
  }
  logger.info(`E-mails van bestelling ${order.display_id} staan in ${dir}`)
}
