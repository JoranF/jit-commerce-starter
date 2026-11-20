import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { resolveCj } from "../../../../../../modules/cj-dropshipping/lib/resolve"
import { CJ_ORDER_FIELDS } from "../../../../../../workflows/cj/forward-order-to-cj"
import { syncCjOrder, type SyncableOrder } from "../../../../../../workflows/cj/sync-cj-order"

/** POST /admin/cj/orders/:id/sync — status + track & trace nu ophalen bij CJ. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!resolveCj(req.scope)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "CJ Dropshipping is not configured (CJ_API_KEY)")
  }
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [...CJ_ORDER_FIELDS, "fulfillments.id"],
    filters: { id: req.params.id },
  })
  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Order ${req.params.id} not found`)
  }
  const result = await syncCjOrder(req.scope, order as unknown as SyncableOrder)
  res.json({ result })
}
