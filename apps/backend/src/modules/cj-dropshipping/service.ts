import { MedusaError } from "@medusajs/framework/utils"
import { CjApiError, CjClient, type CjOrderDetail } from "./client"
import {
  buildCjOrder,
  chooseLogistic,
  cjOrderNumber,
  getCjLines,
  type CjLine,
  type OrderLike,
} from "./lib/build-order"

export type CjModuleOptions = {
  apiKey: string
  /** true = CJ pays the order from your CJ balance immediately (payType 2). */
  autoPay?: boolean
  /** true = orders are created as CJ sandbox orders (no real shipment). */
  sandbox?: boolean
  /** Warehouse country when a variant has no cj_from_country. Default "CN". */
  defaultFromCountry?: string
  /** CJ shipping methods to use first, in order of preference. */
  preferredLogistics?: string[]
  /** Pick the cheapest method that arrives within this many days. Default 15. */
  maxDeliveryDays?: number
  /** Prefix of the order number at CJ, e.g. "jit" → "jit-1042". */
  orderNumberPrefix?: string
  /** Name of the API store in CJ (optional). */
  storeName?: string
  /** Create a Medusa fulfillment + shipment when CJ has a tracking number. Default true. */
  createFulfillment?: boolean
  /** Override the API base URL (tests / mock server). */
  baseUrl?: string
  /** Note on every CJ order (default: neutral packaging, no invoice). "" = none. */
  orderRemark?: string
}

export type CjForwardedOrder = {
  orderNumber: string
  orderId: string
  logisticName: string
  fromCountry: string
  amountUsd?: number
  alreadyExisted: boolean
}

export type CjForwardResult =
  | { status: "skipped"; reason: string }
  | { status: "created"; orders: CjForwardedOrder[] }

type InjectedDependencies = Record<string, unknown>

export default class CjDropshippingService {
  protected client: CjClient
  readonly options: Required<Omit<CjModuleOptions, "storeName" | "baseUrl" | "orderRemark">> & {
    storeName?: string
    orderRemark?: string
  }

  constructor(_deps: InjectedDependencies, options: CjModuleOptions) {
    this.options = {
      apiKey: options.apiKey,
      autoPay: options.autoPay ?? false,
      sandbox: options.sandbox ?? false,
      defaultFromCountry: (options.defaultFromCountry ?? "CN").toUpperCase(),
      preferredLogistics: options.preferredLogistics ?? [],
      maxDeliveryDays: options.maxDeliveryDays ?? 15,
      orderNumberPrefix: options.orderNumberPrefix ?? "medusa",
      storeName: options.storeName,
      createFulfillment: options.createFulfillment ?? true,
      orderRemark: options.orderRemark,
    }
    this.client = new CjClient({ apiKey: this.options.apiKey, baseUrl: options.baseUrl })
  }

  getClient(): CjClient {
    return this.client
  }

  /** Lines of this order that are linked to CJ products. */
  getCjLines(order: OrderLike): CjLine[] {
    return getCjLines(order)
  }

  /**
   * Create the CJ order(s) for a Medusa order. Safe to call twice: if CJ already
   * has an order with the same order number, that one is returned.
   * Lines from different warehouse countries become separate CJ orders.
   */
  async forwardOrder(order: OrderLike): Promise<CjForwardResult> {
    const lines = getCjLines(order)
    if (!lines.length) {
      return { status: "skipped", reason: "no CJ-linked items (variant metadata cj_vid)" }
    }

    const groups = new Map<string, CjLine[]>()
    for (const l of lines) {
      const from = l.fromCountry ?? this.options.defaultFromCountry
      groups.set(from, [...(groups.get(from) ?? []), l])
    }

    const base = cjOrderNumber(order, this.options.orderNumberPrefix)
    const results: CjForwardedOrder[] = []
    let i = 0
    for (const [fromCountry, group] of groups) {
      i++
      const orderNumber = groups.size > 1 ? `${base}-${i}` : base

      const existing = await this.client.getOrderDetail(orderNumber)
      if (existing?.orderId) {
        results.push({
          orderNumber,
          orderId: existing.orderId,
          logisticName: existing.logisticName ?? "",
          fromCountry,
          alreadyExisted: true,
        })
        continue
      }

      const logisticName = await this.pickLogistic(order, group, fromCountry)
      const input = buildCjOrder(order, group, {
        logisticName,
        fromCountryCode: fromCountry,
        autoPay: this.options.autoPay,
        sandbox: this.options.sandbox,
        orderNumberPrefix: this.options.orderNumberPrefix,
        storeName: this.options.storeName,
        remark: this.options.orderRemark,
      })
      input.orderNumber = orderNumber

      try {
        const created = await this.client.createOrder(input)
        results.push({
          orderNumber,
          orderId: created.orderId,
          logisticName,
          fromCountry,
          amountUsd: Number(created.actualPayment ?? created.orderAmount) || undefined,
          alreadyExisted: false,
        })
      } catch (e) {
        // A parallel run (or an earlier timed-out call) may have created it.
        if (e instanceof CjApiError) {
          const again = await this.client.getOrderDetail(orderNumber)
          if (again?.orderId) {
            results.push({
              orderNumber,
              orderId: again.orderId,
              logisticName: again.logisticName ?? logisticName,
              fromCountry,
              alreadyExisted: true,
            })
            continue
          }
        }
        throw e
      }
    }
    return { status: "created", orders: results }
  }

  private async pickLogistic(order: OrderLike, group: CjLine[], fromCountry: string) {
    const fixed = group.find((l) => l.logistic)?.logistic
    if (fixed) {
      return fixed
    }
    const to = order.shipping_address?.country_code?.toUpperCase()
    if (!to) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Order has no shipping country")
    }
    const options = await this.client.freightCalculate({
      startCountryCode: fromCountry,
      endCountryCode: to,
      zip: order.shipping_address?.postal_code ?? undefined,
      products: group.map(({ vid, quantity }) => ({ vid, quantity })),
    })
    const choice = chooseLogistic(
      options,
      this.options.preferredLogistics,
      this.options.maxDeliveryDays
    )
    if (!choice) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `CJ offers no shipping method from ${fromCountry} to ${to}`
      )
    }
    return choice.logisticName
  }

  getOrder(orderIdOrNumber: string): Promise<CjOrderDetail | null> {
    return this.client.getOrderDetail(orderIdOrNumber)
  }
}
