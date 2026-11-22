import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getCjLines } from "../modules/cj-dropshipping/lib/build-order"
import { resolveCj } from "../modules/cj-dropshipping/lib/resolve"
import {
  CJ_MAX_ATTEMPTS,
  CJ_ORDER_FIELDS,
  forwardOrderToCjWorkflow,
} from "../workflows/cj/forward-order-to-cj"
import { isFinalCjStatus, syncCjOrder, type SyncableOrder } from "../workflows/cj/sync-cj-order"

const DAY = 86_400_000

/**
 * Elke 30 minuten:
 * 1. bestellingen die bij CJ staan → status + track & trace ophalen
 *    (en in Medusa als verzonden markeren zodra er een trackingnummer is);
 * 2. bestellingen waarvan doorsturen mislukte → opnieuw proberen (max. 5x);
 * 3. CJ-bestellingen die nooit zijn doorgestuurd (bv. backend lag eruit) → alsnog.
 */
export default async function cjSyncJob(container: MedusaContainer) {
  if (!resolveCj(container)) {
    return
  }
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [...CJ_ORDER_FIELDS, "fulfillments.id", "status"],
    filters: { created_at: { $gte: new Date(Date.now() - 60 * DAY) } },
    pagination: { take: 500, order: { created_at: "DESC" } },
  })

  let synced = 0
  let retried = 0
  for (const o of orders as unknown as (SyncableOrder & {
    created_at: string | Date
    status?: string
  })[]) {
    const meta = (o.metadata ?? {}) as Record<string, unknown>
    const age = Date.now() - new Date(o.created_at).getTime()
    try {
      if (meta.cj_order_id && !isFinalCjStatus(meta.cj_status)) {
        await syncCjOrder(container, o)
        synced++
      } else if (
        !meta.cj_order_id &&
        o.status !== "canceled" &&
        age > 10 * 60_000 && // give the order.placed subscriber time first
        age < 7 * DAY &&
        Number(meta.cj_attempts ?? 0) < CJ_MAX_ATTEMPTS &&
        getCjLines(o).length
      ) {
        await forwardOrderToCjWorkflow(container).run({ input: { order_id: o.id } })
        retried++
      }
    } catch (e) {
      logger.warn(`[cj] sync of order ${o.id} failed: ${(e as Error).message}`)
    }
  }
  if (synced || retried) {
    logger.info(`[cj] sync: ${synced} checked at CJ, ${retried} (re)forwarded`)
  }
}

export const config = {
  name: "cj-sync",
  schedule: "*/30 * * * *",
}
