import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import seedDemoData from "./seed"

/**
 * Draait bij elke container-start (zie docker-entrypoint.sh), is idempotent:
 *
 * 1. Lege database + SEED_DEMO=true → demo-winkel (NL/BE/DE, EUR, btw, verzending).
 * 2. MEDUSA_PUBLISHABLE_KEY gezet → de publishable key krijgt precies die waarde.
 *    Zo kun je dezelfde key vooraf in de storefront zetten (NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY)
 *    en hoef je niet te wachten tot de backend een key heeft gegenereerd.
 * 3. MEDUSA_ADMIN_EMAIL + MEDUSA_ADMIN_PASSWORD → admin-gebruiker aanmaken (eenmalig).
 */
export default async function bootstrap({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const regionService = container.resolve(Modules.REGION)

  const regions = await regionService.listRegions({}, { take: 1 })
  if (!regions.length && process.env.SEED_DEMO === "true") {
    logger.info("[bootstrap] Lege database → demo-data seeden…")
    await seedDemoData({ container } as ExecArgs)
  }

  const fixedKey = process.env.MEDUSA_PUBLISHABLE_KEY
  if (fixedKey) {
    if (!/^pk_[a-zA-Z0-9]{16,}$/.test(fixedKey)) {
      logger.warn("[bootstrap] MEDUSA_PUBLISHABLE_KEY moet beginnen met pk_ (genereer: echo pk_$(openssl rand -hex 32))")
    } else {
      const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const keys = await pg("api_key")
        .select("id", "token")
        .where({ type: "publishable" })
        .whereNull("deleted_at")
        .orderBy("created_at", "asc")
      if (keys.length && keys[0].token !== fixedKey) {
        await pg("api_key").update({ token: fixedKey }).where({ id: keys[0].id })
        logger.info("[bootstrap] Publishable key ingesteld op MEDUSA_PUBLISHABLE_KEY")
      }
    }
  }

  const email = process.env.MEDUSA_ADMIN_EMAIL
  const password = process.env.MEDUSA_ADMIN_PASSWORD
  if (email && password) {
    const userService = container.resolve(Modules.USER)
    const existing = await userService.listUsers({ email })
    if (!existing.length) {
      const authService = container.resolve(Modules.AUTH)
      const { authIdentity, error } = await authService.register("emailpass", {
        body: { email, password },
      } as any)
      if (error || !authIdentity) {
        logger.warn(`[bootstrap] Admin aanmaken mislukt: ${error}`)
      } else {
        const user = await userService.createUsers({ email })
        await authService.updateAuthIdentities({
          id: authIdentity.id,
          app_metadata: { user_id: user.id },
        })
        logger.info(`[bootstrap] Admin-gebruiker aangemaakt: ${email}`)
      }
    }
  }

  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const [key] = await pg("api_key").select("token").where({ type: "publishable" }).whereNull("deleted_at").limit(1)
  if (key) logger.info(`[bootstrap] Publishable key: ${key.token}`)
}
