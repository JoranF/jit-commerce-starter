import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { resolveCj } from "../../../../../../modules/cj-dropshipping/lib/resolve"
import { forwardOrderToCjWorkflow } from "../../../../../../workflows/cj/forward-order-to-cj"

/** POST /admin/cj/orders/:id/forward — (opnieuw) doorsturen naar CJ. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!resolveCj(req.scope)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "CJ Dropshipping is not configured (CJ_API_KEY)")
  }
  const { result } = await forwardOrderToCjWorkflow(req.scope).run({
    input: { order_id: req.params.id, force: true },
  })
  res.json({ result })
}
