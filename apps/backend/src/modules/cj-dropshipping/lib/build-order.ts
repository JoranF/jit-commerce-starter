import { MedusaError } from "@medusajs/framework/utils"
import type { CjCreateOrderInput, CjFreightOption, CjOrderProduct } from "../client"

/**
 * Pure helpers that turn a Medusa order into a CJ order. No I/O, so they are
 * unit-tested directly (see __tests__/build-order.unit.spec.ts).
 *
 * Linking a Medusa variant to CJ = set variant metadata:
 *   cj_vid           (required) CJ variant id
 *   cj_from_country  (optional) warehouse country, e.g. "CN", "DE", "NL"
 *   cj_logistic      (optional) fixed CJ shipping method, e.g. "CJPacket Ordinary"
 * Product metadata with the same keys works as a fallback for all its variants.
 */

export type OrderItemLike = {
  id: string
  quantity: number | string
  title?: string | null
  variant_id?: string | null
  variant?: { metadata?: Record<string, unknown> | null } | null
  product?: { metadata?: Record<string, unknown> | null } | null
}

export type AddressLike = {
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
}

export type OrderLike = {
  id: string
  display_id?: number | string | null
  email?: string | null
  shipping_address?: AddressLike | null
  items?: OrderItemLike[] | null
  metadata?: Record<string, unknown> | null
}

export type CjLine = CjOrderProduct & {
  fromCountry?: string
  logistic?: string
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined)

function meta(item: OrderItemLike, key: string): string | undefined {
  return str(item.variant?.metadata?.[key]) ?? str(item.product?.metadata?.[key])
}

/** Order lines that are linked to CJ (have a cj_vid). Others are ignored. */
export function getCjLines(order: OrderLike): CjLine[] {
  return (order.items ?? [])
    .map((item) => ({
      vid: meta(item, "cj_vid") ?? "",
      quantity: Math.round(Number(item.quantity)),
      storeLineItemId: item.id,
      fromCountry: meta(item, "cj_from_country")?.toUpperCase(),
      logistic: meta(item, "cj_logistic"),
    }))
    .filter((l) => l.vid && l.quantity > 0)
}

/** The order number we send to CJ. Stable → CJ rejects duplicates. */
export function cjOrderNumber(order: OrderLike, prefix = "medusa"): string {
  return `${prefix}-${order.display_id ?? order.id}`
}

/** Highest number of days in a CJ aging string like "7-12" or "5". */
export function maxDays(aging: string | undefined): number {
  const nums = (aging ?? "").match(/\d+/g)?.map(Number) ?? []
  return nums.length ? Math.max(...nums) : Number.POSITIVE_INFINITY
}

/**
 * Pick a shipping method:
 * 1. the first name from `preferred` that CJ offers (case-insensitive);
 * 2. otherwise the cheapest option that arrives within `maxDeliveryDays`;
 * 3. otherwise the fastest option.
 */
export function chooseLogistic(
  options: CjFreightOption[],
  preferred: string[] = [],
  maxDeliveryDays = 15
): CjFreightOption | undefined {
  if (!options?.length) {
    return undefined
  }
  for (const name of preferred) {
    const hit = options.find((o) => o.logisticName.toLowerCase() === name.toLowerCase())
    if (hit) {
      return hit
    }
  }
  const inTime = options
    .filter((o) => maxDays(o.logisticAging) <= maxDeliveryDays)
    .sort((a, b) => Number(a.logisticPrice) - Number(b.logisticPrice))
  if (inTime.length) {
    return inTime[0]
  }
  return [...options].sort((a, b) => maxDays(a.logisticAging) - maxDays(b.logisticAging))[0]
}

/** "Damrak 12a" → { street: "Damrak", houseNumber: "12a" }. Leaves other formats alone. */
export function splitHouseNumber(line: string): { street: string; houseNumber?: string } {
  const m = line.trim().match(/^(.*\D)\s+(\d+(?:\s?[-/]?\s?[a-zA-Z0-9]{1,4})?)$/)
  if (!m) {
    return { street: line.trim() }
  }
  return { street: m[1].trim(), houseNumber: m[2].replace(/\s+/g, "") }
}

const countryName = (code: string) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

export type BuildOptions = {
  logisticName: string
  fromCountryCode: string
  autoPay: boolean
  sandbox: boolean
  orderNumberPrefix?: string
  storeName?: string
}

export function buildCjOrder(
  order: OrderLike,
  lines: CjLine[],
  opts: BuildOptions
): CjCreateOrderInput {
  const a = order.shipping_address
  if (!a?.country_code || !a.address_1 || !a.city) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Order has no complete shipping address")
  }
  const name = [a.first_name, a.last_name].filter(Boolean).join(" ").trim()
  const { street, houseNumber } = splitHouseNumber(a.address_1)
  return {
    orderNumber: cjOrderNumber(order, opts.orderNumberPrefix),
    shippingCountryCode: a.country_code.toUpperCase(),
    shippingCountry: countryName(a.country_code),
    // NL/BE addresses usually have no province; CJ requires one.
    shippingProvince: str(a.province) ?? a.city,
    shippingCity: a.city,
    shippingZip: str(a.postal_code),
    shippingAddress: houseNumber ? `${street} ${houseNumber}` : street,
    shippingAddress2: [str(a.company), str(a.address_2)].filter(Boolean).join(", ") || undefined,
    houseNumber,
    shippingCustomerName: name || a.company || "Customer",
    shippingPhone: str(a.phone),
    email: str(order.email),
    logisticName: opts.logisticName,
    fromCountryCode: opts.fromCountryCode,
    payType: opts.autoPay ? 2 : 3,
    isSandbox: opts.sandbox ? 1 : 0,
    storeName: opts.storeName,
    products: lines.map(({ vid, quantity, storeLineItemId }) => ({
      vid,
      quantity,
      storeLineItemId,
    })),
  }
}
