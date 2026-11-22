import { ExecArgs, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"
import { wantedRegionProviders } from "../lib/payment-providers"

/**
 * Draait bij elke container-start ná `medusa db:migrate` (zie docker-entrypoint.sh).
 * De winkel zelf (regio, btw, verzending, demo-producten) wordt eenmalig geseed
 * door src/migration-scripts/initial-data-seed.ts tijdens de eerste migratie.
 *
 * Idempotent:
 * 1. MEDUSA_PUBLISHABLE_KEY gezet → de publishable key krijgt precies die waarde.
 *    Zo kun je dezelfde key vooraf in de storefront zetten (NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY).
 * 2. MEDUSA_ADMIN_EMAIL + MEDUSA_ADMIN_PASSWORD → admin-gebruiker aanmaken (eenmalig).
 * 3. MOLLIE_API_KEY gezet → Mollie-betaalmethodes aan de regio's gekoppeld en de
 *    handmatige testbetaling eraf (anders kan iedereen bestellen zonder te betalen).
 *    ALLOW_TEST_PAYMENT=true laat de testbetaling staan, alleen om te testen.
 */
export default async function bootstrap({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const fixedKey = process.env.MEDUSA_PUBLISHABLE_KEY
  if (fixedKey) {
    if (!/^pk_[a-zA-Z0-9]{16,}$/.test(fixedKey)) {
      logger.warn(
        "[bootstrap] MEDUSA_PUBLISHABLE_KEY moet beginnen met pk_ (genereer: echo pk_$(openssl rand -hex 32))"
      )
    } else {
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

  await syncPaymentProviders(container).catch((e) =>
    logger.warn(`[bootstrap] Betaalmethodes bijwerken mislukt: ${(e as Error).message}`)
  )

  const [key] = await pg("api_key")
    .select("token")
    .where({ type: "publishable" })
    .whereNull("deleted_at")
    .limit(1)
  if (key) logger.info(`[bootstrap] Publishable key: ${key.token}`)
}

async function syncPaymentProviders(container: MedusaContainer) {
  const mollie = !!process.env.MOLLIE_API_KEY
  if (!mollie) {
    return
  }
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const providers = await container
    .resolve(Modules.PAYMENT)
    .listPaymentProviders({ is_enabled: true }, { take: 200 })
  const available = providers.map((p) => p.id)

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "payment_providers.id"],
  })
  for (const region of regions as { id: string; name: string; payment_providers?: { id: string }[] }[]) {
    const current = (region.payment_providers ?? []).map((p) => p.id)
    const next = wantedRegionProviders(current, {
      mollie,
      allowTest: process.env.ALLOW_TEST_PAYMENT === "true",
      available,
    })
    if (!next) {
      continue
    }
    await updateRegionsWorkflow(container).run({
      input: { selector: { id: region.id }, update: { payment_providers: next } },
    })
    logger.info(`[bootstrap] Betaalmethodes ${region.name}: ${next.join(", ")}`)
  }
}
