import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createOrderFulfillmentWorkflow,
  createOrderShipmentWorkflow,
} from "@medusajs/medusa/core-flows"
import type { CjOrderDetail } from "../../modules/cj-dropshipping/client"
import { getCjLines, type OrderLike } from "../../modules/cj-dropshipping/lib/build-order"
import { resolveCj } from "../../modules/cj-dropshipping/lib/resolve"

/** CJ order status → our cj_status in order.metadata. */
export function mapCjStatus(cjStatus: string | undefined | null): string {
  switch ((cjStatus ?? "").toUpperCase()) {
    case "CREATED":
    case "IN_CART":
    case "UNPAID":
      return "awaiting_payment"
    case "PENDING":
    case "PROCESSING":
    case "UNSHIPPED":
      return "processing"
    case "SHIPPED":
      return "shipped"
    case "DELIVERED":
      return "delivered"
    case "CANCELLED":
      return "cancelled"
    default:
      return "processing"
  }
}

const FINAL = new Set(["delivered", "cancelled"])

export type SyncableOrder = OrderLike & {
  fulfillments?: { id: string }[] | null
}

export type SyncResult = {
  status: string
  tracking?: string
  fulfillmentCreated?: boolean
  error?: string
}

async function mergeMetadata(
  container: MedusaContainer,
  orderId: string,
  patch: Record<string, unknown>
) {
  const orderModule = container.resolve(Modules.ORDER)
  const o = await orderModule.retrieveOrder(orderId, { select: ["id", "metadata"] })
  await orderModule.updateOrders(orderId, {
    metadata: { ...((o.metadata ?? {}) as Record<string, unknown>), ...patch },
  })
}

/**
 * Pull status + tracking from CJ for one forwarded order. When CJ has a tracking
 * number, create a Medusa fulfillment + shipment with that tracking number (so
 * the order shows as shipped and a shipping notification can go out).
 */
export async function syncCjOrder(
  container: MedusaContainer,
  order: SyncableOrder
): Promise<SyncResult> {
  const cj = resolveCj(container)
  const meta = (order.metadata ?? {}) as Record<string, unknown>
  const ids = String(meta.cj_order_id ?? "")
    .split(",")
    .filter(Boolean)
  if (!cj || !ids.length) {
    return { status: String(meta.cj_status ?? "none") }
  }

  const found: CjOrderDetail[] = []
  for (const id of ids) {
    const d = await cj.getOrder(id)
    if (d) {
      found.push(d)
    }
  }
  if (!found.length) {
    return { status: String(meta.cj_status), error: "CJ order not found" }
  }

  // The "least advanced" order decides the overall status.
  const order_rank = ["cancelled", "awaiting_payment", "processing", "shipped", "delivered"]
  const statuses = found.map((d) => mapCjStatus(d.orderStatus))
  const status = statuses.sort((a, b) => order_rank.indexOf(a) - order_rank.indexOf(b))[0]
  const tracking = found.map((d) => d.trackNumber).filter(Boolean).join(",")
  const trackingUrl =
    found.map((d) => d.trackingUrl).find(Boolean) ??
    (tracking ? `https://t.17track.net/en#nums=${encodeURIComponent(tracking)}` : "")

  const patch: Record<string, unknown> = {
    cj_status: status,
    cj_synced_at: new Date().toISOString(),
  }
  if (tracking) {
    patch.cj_tracking_number = tracking
    patch.cj_tracking_url = trackingUrl
  }

  let fulfillmentCreated = false
  if (
    tracking &&
    cj.options.createFulfillment &&
    !meta.cj_fulfillment_id &&
    !(order.fulfillments ?? []).length
  ) {
    try {
      // Medusa line quantities (a "2 lampen" line is 1 item here, 2 units at CJ).
      const items = getCjLines(order).map((l) => ({
        id: l.storeLineItemId!,
        quantity: l.itemQuantity,
      }))
      const labels = [{ tracking_number: tracking, tracking_url: trackingUrl, label_url: trackingUrl }]
      const { result: fulfillment } = await createOrderFulfillmentWorkflow(container).run({
        input: { order_id: order.id, items, labels, no_notification: true },
      })
      await createOrderShipmentWorkflow(container).run({
        input: { order_id: order.id, fulfillment_id: fulfillment.id, items, labels },
      })
      patch.cj_fulfillment_id = fulfillment.id
      fulfillmentCreated = true
    } catch (e) {
      patch.cj_fulfillment_error = (e as Error).message?.slice(0, 300)
    }
  }

  await mergeMetadata(container, order.id, patch)
  return { status, tracking: tracking || undefined, fulfillmentCreated }
}

export const isFinalCjStatus = (s: unknown) => FINAL.has(String(s))
