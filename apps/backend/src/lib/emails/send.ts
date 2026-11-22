import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { STORE_SETUPS } from "../../scripts/stores/definitions"
import type { Brand, RenderedEmail } from "./templates"

/** Merk + bedrijfsgegevens van de winkel (STORE_ID), met env als terugval. */
export function getBrand(): Brand {
  const setup = process.env.STORE_ID ? STORE_SETUPS[process.env.STORE_ID] : undefined
  const brand = setup?.brand
  const siteUrl = (process.env.STORE_URL || process.env.STORE_CORS?.split(",")[0] || "").trim().replace(/\/$/, "")
  return {
    name: brand?.name || process.env.STORE_NAME || "Webshop",
    siteUrl,
    colors: {
      dark: brand?.colors?.dark ?? "#1b2a2d",
      light: brand?.colors?.light ?? "#f2f3f1",
      accent: brand?.colors?.accent ?? brand?.colors?.dark ?? "#1b2a2d",
    },
    company: brand?.company ?? {},
  }
}

/** Is er een e-mailprovider? (anders logt Medusa de mail alleen) */
export const emailEnabled = () => !!(process.env.RESEND_API_KEY || process.env.BREVO_API_KEY)

/**
 * Verstuur een e-mail via de Notification Module. Faalt nooit hard: een mail mag
 * een bestelling niet blokkeren. Idempotent per `idempotencyKey` (bv. bij een
 * herhaald event wordt dezelfde mail niet nog eens verstuurd).
 */
export async function sendEmail(
  container: MedusaContainer,
  input: {
    to: string | null | undefined
    template: string
    email: RenderedEmail
    resourceId?: string
    resourceType?: string
    idempotencyKey?: string
  }
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  if (!input.to) {
    logger.warn(`[email] "${input.template}" niet verstuurd: geen e-mailadres`)
    return
  }
  try {
    await container.resolve(Modules.NOTIFICATION).createNotifications({
      to: input.to,
      channel: "email",
      template: input.template,
      content: input.email,
      resource_id: input.resourceId,
      resource_type: input.resourceType,
      idempotency_key: input.idempotencyKey,
      data: {},
    })
  } catch (e) {
    logger.warn(`[email] "${input.template}" naar ${input.to} mislukt: ${(e as Error).message}`)
  }
}
