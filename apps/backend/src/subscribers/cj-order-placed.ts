import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { resolveCj } from "../modules/cj-dropshipping/lib/resolve"
import { forwardOrderToCjWorkflow } from "../workflows/cj/forward-order-to-cj"

/**
 * Dropshipping: stuurt elke nieuwe bestelling met CJ-producten (variant metadata
 * `cj_vid`) automatisch door naar CJ Dropshipping. Mislukt het, dan staat de fout
 * op de bestelling (admin-widget) en probeert de job `cj-sync` het opnieuw.
 */
export default async function cjOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  if (!resolveCj(container)) {
    return
  }
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const { result } = await forwardOrderToCjWorkflow(container).run({
      input: { order_id: data.id },
    })
    if (result.status === "blocked") {
      logger.warn(`[cj] order ${data.id} NOT forwarded: not paid through a real payment provider`)
    } else if (result.status === "error") {
      logger.warn(`[cj] order ${data.id} not forwarded: ${String(result.metadata?.cj_error)}`)
    } else if (result.status === "created") {
      logger.info(`[cj] order ${data.id} forwarded to CJ`)
    }
  } catch (e) {
    logger.error(`[cj] forwarding order ${data.id} failed: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
