import { Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { CJ_DROPSHIPPING_MODULE } from "../../modules/cj-dropshipping"
import type CjDropshippingService from "../../modules/cj-dropshipping/service"
import type { OrderLike } from "../../modules/cj-dropshipping/lib/build-order"

/**
 * Forwards a Medusa order to CJ Dropshipping and records the outcome in
 * order.metadata (cj_status, cj_order_id, cj_error, ...), which the admin
 * widget shows. Errors are recorded, not thrown, so the sync job can retry.
 */

export const CJ_ORDER_FIELDS = [
  "id",
  "display_id",
  "email",
  "created_at",
  "metadata",
  "shipping_address.*",
  "items.id",
  "items.quantity",
  "items.title",
  "items.variant_id",
  "items.variant.metadata",
  "items.product.metadata",
]

export type ForwardOrderToCjInput = { order_id: string; force?: boolean }

type StepOutput = {
  order_id: string
  metadata: Record<string, unknown> | null
  status: string
}

const forwardToCjStep = createStep(
  "forward-to-cj",
  async (input: { order: OrderLike; force?: boolean }, { container }): Promise<StepResponse<StepOutput>> => {
    const { order, force } = input
    const cj = container.resolve<CjDropshippingService>(CJ_DROPSHIPPING_MODULE)
    const meta = (order.metadata ?? {}) as Record<string, unknown>

    if (!force && meta.cj_order_id) {
      return new StepResponse({ order_id: order.id, metadata: null, status: "already_forwarded" })
    }

    const attempts = Number(meta.cj_attempts ?? 0) + 1
    try {
      const res = await cj.forwardOrder(order)
      if (res.status === "skipped") {
        return new StepResponse({ order_id: order.id, metadata: null, status: "skipped" })
      }
      const first = res.orders[0]
      const allExisted = res.orders.every((o) => o.alreadyExisted)
      const amount = res.orders.reduce((s, o) => s + (o.amountUsd ?? 0), 0)
      const metadata: Record<string, unknown> = {
        cj_order_id: res.orders.map((o) => o.orderId).join(","),
        cj_order_number: res.orders.map((o) => o.orderNumber).join(","),
        cj_from_country: first.fromCountry,
        cj_sandbox: cj.options.sandbox || null,
        cj_attempts: attempts,
        cj_error: null,
      }
      if (allExisted) {
        // Re-forward of an order CJ already has: keep what we know (status, amount);
        // the sync job / "Status ophalen" refreshes the status from CJ.
        metadata.cj_status =
          meta.cj_status && meta.cj_status !== "error" ? meta.cj_status : "processing"
        if (first.logisticName) {
          metadata.cj_logistic = first.logisticName
        }
      } else {
        metadata.cj_status = cj.options.autoPay ? "paid" : "awaiting_payment"
        metadata.cj_logistic = first.logisticName
        metadata.cj_forwarded_at = new Date().toISOString()
        if (amount) {
          metadata.cj_amount_usd = Math.round(amount * 100) / 100
        }
      }
      return new StepResponse({ order_id: order.id, status: "created", metadata })
    } catch (e) {
      return new StepResponse({
        order_id: order.id,
        status: "error",
        metadata: {
          cj_status: "error",
          cj_error: (e as Error).message?.slice(0, 500) ?? "unknown error",
          cj_attempts: attempts,
          cj_last_attempt_at: new Date().toISOString(),
        },
      })
    }
  }
)

export const saveCjOrderMetadataStep = createStep(
  "save-cj-order-metadata",
  async (input: { order_id: string; metadata: Record<string, unknown> | null }, { container }) => {
    if (!input.metadata) {
      return new StepResponse(null, null)
    }
    const orderModule = container.resolve(Modules.ORDER)
    const before = await orderModule.retrieveOrder(input.order_id, { select: ["id", "metadata"] })
    const previous = (before.metadata ?? {}) as Record<string, unknown>
    await orderModule.updateOrders(input.order_id, {
      metadata: { ...previous, ...input.metadata },
    })
    return new StepResponse(null, { order_id: input.order_id, previous })
  },
  async (comp, { container }) => {
    if (!comp) {
      return
    }
    await container
      .resolve(Modules.ORDER)
      .updateOrders(comp.order_id, { metadata: comp.previous })
  }
)

export const forwardOrderToCjWorkflow = createWorkflow(
  "forward-order-to-cj",
  (input: ForwardOrderToCjInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: CJ_ORDER_FIELDS,
      filters: { id: input.order_id },
      options: { throwIfKeyNotFound: true },
    })

    const stepInput = transform({ orders, input }, ({ orders, input }) => ({
      order: orders[0] as unknown as OrderLike,
      force: input.force,
    }))

    const result = forwardToCjStep(stepInput)
    saveCjOrderMetadataStep(result)

    return new WorkflowResponse(result)
  }
)
