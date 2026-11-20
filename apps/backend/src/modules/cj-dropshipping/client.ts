import { MedusaError } from "@medusajs/framework/utils"

/**
 * Minimal client for the CJ Dropshipping API v2
 * (https://developers.cjdropshipping.com/en/api/api2/).
 *
 * - Auth: one API key → access token (valid 180 days). Cached in memory and
 *   refreshed on expiry or on a 401-style error.
 * - Rate limit: CJ allows 1 request per second per account, so calls are queued.
 */

export const CJ_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1"

export class CjApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public requestId?: string
  ) {
    super(message)
    this.name = "CjApiError"
  }
}

type CjResponse<T> = {
  code: number
  result: boolean
  success?: boolean
  message: string
  data: T
  requestId?: string
}

export type CjFreightOption = {
  logisticName: string
  logisticAging: string // e.g. "7-12"
  logisticPrice: number // USD
}

export type CjOrderProduct = {
  vid: string
  quantity: number
  storeLineItemId?: string
}

export type CjCreateOrderInput = {
  orderNumber: string
  shippingCountryCode: string
  shippingCountry: string
  shippingProvince: string
  shippingCity: string
  shippingZip?: string
  shippingAddress: string
  shippingAddress2?: string
  houseNumber?: string
  shippingCustomerName: string
  shippingPhone?: string
  email?: string
  remark?: string
  logisticName: string
  fromCountryCode: string
  payType: 2 | 3
  isSandbox?: 0 | 1
  storeName?: string
  products: CjOrderProduct[]
}

export type CjCreatedOrder = {
  orderId: string
  orderNumber: string
  orderStatus?: string
  actualPayment?: number | string
  orderAmount?: number | string
}

export type CjOrderDetail = {
  orderId: string
  orderNum: string
  cjOrderId?: string | null
  orderStatus: string
  logisticName?: string
  trackNumber?: string | null
  trackingUrl?: string | null
  orderAmount?: number | string
}

export type CjVariant = {
  vid: string
  pid: string
  variantNameEn?: string | null
  variantSku?: string
  variantKey?: string | null
  variantSellPrice?: number
  variantWeight?: number
}

type FetchLike = (url: string, init?: any) => Promise<{
  status: number
  json: () => Promise<any>
}>

export type CjClientOptions = {
  apiKey: string
  baseUrl?: string
  /** Minimum ms between calls (CJ: 1 QPS). */
  minIntervalMs?: number
  fetch?: FetchLike
}

/** CJ error codes that mean "token invalid/expired". */
const AUTH_ERROR_CODES = new Set([1600001, 1600002, 1600003])

export class CjClient {
  private apiKey: string
  private baseUrl: string
  private minIntervalMs: number
  private fetchImpl: FetchLike
  private token?: { value: string; expiresAt: number }
  private queue: Promise<unknown> = Promise.resolve()
  private lastCallAt = 0

  constructor(opts: CjClientOptions) {
    if (!opts.apiKey) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "CJ Dropshipping: apiKey is required")
    }
    this.apiKey = opts.apiKey
    this.baseUrl = opts.baseUrl ?? CJ_BASE_URL
    this.minIntervalMs = opts.minIntervalMs ?? 1100
    this.fetchImpl = opts.fetch ?? (globalThis.fetch as unknown as FetchLike)
  }

  /** Serialize calls and keep ≥ minIntervalMs between them. */
  private schedule<T>(fn: () => Promise<T>): Promise<T> {
    const run = async () => {
      const wait = this.lastCallAt + this.minIntervalMs - Date.now()
      if (wait > 0) {
        await new Promise((r) => setTimeout(r, wait))
      }
      this.lastCallAt = Date.now()
      return fn()
    }
    const p = this.queue.then(run, run)
    this.queue = p.catch(() => undefined)
    return p
  }

  private async raw<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    withToken = true
  ): Promise<CjResponse<T>> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (withToken) {
      headers["CJ-Access-Token"] = await this.getAccessToken()
    }
    const res = await this.schedule(() =>
      this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    )
    let json: CjResponse<T>
    try {
      json = await res.json()
    } catch {
      throw new CjApiError(`CJ returned HTTP ${res.status} without JSON`)
    }
    return json
  }

  private async call<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown
  ): Promise<T> {
    let json = await this.raw<T>(method, path, body)
    if (!json.result && AUTH_ERROR_CODES.has(json.code)) {
      this.token = undefined
      json = await this.raw<T>(method, path, body)
    }
    if (!json.result || (json.code !== 200 && json.code !== 0)) {
      throw new CjApiError(json.message || "CJ request failed", json.code, json.requestId)
    }
    return json.data
  }

  private tokenRequest?: Promise<string>

  async getAccessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) {
      return this.token.value
    }
    // Concurrent callers share one token request.
    this.tokenRequest ??= this.fetchToken().finally(() => {
      this.tokenRequest = undefined
    })
    return this.tokenRequest
  }

  private async fetchToken(): Promise<string> {
    const json = await this.raw<{
      accessToken: string
      accessTokenExpiryDate: string
    }>("POST", "/authentication/getAccessToken", { apiKey: this.apiKey }, false)
    if (!json.result || !json.data?.accessToken) {
      throw new CjApiError(json.message || "CJ authentication failed", json.code, json.requestId)
    }
    const expires = Date.parse(json.data.accessTokenExpiryDate)
    this.token = {
      value: json.data.accessToken,
      // Fall back to 1 day if the date can't be parsed.
      expiresAt: Number.isFinite(expires) ? expires : Date.now() + 86_400_000,
    }
    return this.token.value
  }

  freightCalculate(input: {
    startCountryCode: string
    endCountryCode: string
    zip?: string
    products: { vid: string; quantity: number }[]
  }): Promise<CjFreightOption[]> {
    return this.call("POST", "/logistic/freightCalculate", input)
  }

  createOrder(input: CjCreateOrderInput): Promise<CjCreatedOrder> {
    return this.call("POST", "/shopping/order/createOrderV2", input)
  }

  /**
   * Accepts the CJ order id or our own orderNumber. Returns null if CJ doesn't
   * know the order. CJ doesn't document a "not found" code, so every API error
   * except "busy" (1600000) and auth errors is treated as not found. That is
   * safe: creating a duplicate order number is rejected by CJ anyway.
   */
  async getOrderDetail(orderId: string): Promise<CjOrderDetail | null> {
    try {
      const data = await this.call<CjOrderDetail | null>(
        "GET",
        `/shopping/order/getOrderDetail?orderId=${encodeURIComponent(orderId)}`
      )
      return data?.orderId ? data : null
    } catch (e) {
      if (
        e instanceof CjApiError &&
        e.code !== undefined &&
        e.code !== 1600000 &&
        !AUTH_ERROR_CODES.has(e.code)
      ) {
        return null
      }
      throw e
    }
  }

  listVariants(pid: string, countryCode?: string): Promise<CjVariant[]> {
    const q = new URLSearchParams({ pid })
    if (countryCode) {
      q.set("countryCode", countryCode)
    }
    return this.call("GET", `/product/variant/query?${q}`)
  }

  getInventoryByProduct(pid: string): Promise<
    { areaEn?: string; countryCode: string; totalInventoryNum?: number }[]
  > {
    return this.call("GET", `/product/stock/getInventoryByPid?pid=${encodeURIComponent(pid)}`)
  }
}
