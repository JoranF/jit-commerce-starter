import { CjApiError, CjClient } from "../client"
import CjDropshippingService from "../service"
import { mapCjStatus } from "../../../workflows/cj/sync-cj-order"

type Call = { url: string; init: any }

/** Fake fetch: routes by URL path to handlers returning CJ-style JSON. */
function fakeFetch(handlers: Record<string, (body: any, call: Call) => any>) {
  const calls: Call[] = []
  const fn = async (url: string, init?: any) => {
    calls.push({ url, init })
    const path = url.replace(/^https?:\/\/[^/]+\/api2\.0\/v1/, "").split("?")[0]
    const h = handlers[path]
    const body = init?.body ? JSON.parse(init.body) : undefined
    const json = h ? h(body, { url, init }) : { code: 1600100, result: false, message: "no handler" }
    return { status: 200, json: async () => json }
  }
  return { fn, calls }
}

const ok = (data: unknown) => ({ code: 200, result: true, message: "Success", data })
const tokenOk = () =>
  ok({ accessToken: "tok-1", accessTokenExpiryDate: new Date(Date.now() + 86_400_000).toISOString() })

describe("CjClient", () => {
  it("fetches a token once and sends it in the CJ-Access-Token header", async () => {
    const { fn, calls } = fakeFetch({
      "/authentication/getAccessToken": tokenOk,
      "/product/variant/query": () => ok([{ vid: "v1", pid: "p1" }]),
    })
    const c = new CjClient({ apiKey: "KEY", fetch: fn, minIntervalMs: 0 })
    await c.listVariants("p1")
    await c.listVariants("p1")
    expect(calls.filter((x) => x.url.includes("getAccessToken"))).toHaveLength(1)
    expect(calls[1].init.headers["CJ-Access-Token"]).toBe("tok-1")
    expect(JSON.parse(calls[0].init.body)).toEqual({ apiKey: "KEY" })
  })

  it("gets a new token and retries once on an auth error", async () => {
    let n = 0
    const { fn, calls } = fakeFetch({
      "/authentication/getAccessToken": tokenOk,
      "/product/variant/query": () =>
        ++n === 1 ? { code: 1600001, result: false, message: "Invalid token" } : ok([]),
    })
    const c = new CjClient({ apiKey: "KEY", fetch: fn, minIntervalMs: 0 })
    await expect(c.listVariants("p1")).resolves.toEqual([])
    expect(calls.filter((x) => x.url.includes("getAccessToken"))).toHaveLength(2)
  })

  it("throws CjApiError with the CJ code", async () => {
    const { fn } = fakeFetch({
      "/authentication/getAccessToken": tokenOk,
      "/logistic/freightCalculate": () => ({ code: 1600100, result: false, message: "Param error", requestId: "r1" }),
    })
    const c = new CjClient({ apiKey: "KEY", fetch: fn, minIntervalMs: 0 })
    await expect(
      c.freightCalculate({ startCountryCode: "CN", endCountryCode: "NL", products: [] })
    ).rejects.toMatchObject({ name: "CjApiError", code: 1600100, requestId: "r1" })
  })

  it("getOrderDetail returns null for unknown orders but rethrows 'busy'", async () => {
    let busy = false
    const { fn } = fakeFetch({
      "/authentication/getAccessToken": tokenOk,
      "/shopping/order/getOrderDetail": () =>
        busy
          ? { code: 1600000, result: false, message: "System busy" }
          : { code: 1603001, result: false, message: "order not exist" },
    })
    const c = new CjClient({ apiKey: "KEY", fetch: fn, minIntervalMs: 0 })
    await expect(c.getOrderDetail("jit-1")).resolves.toBeNull()
    busy = true
    await expect(c.getOrderDetail("jit-1")).rejects.toBeInstanceOf(CjApiError)
  })

  it("keeps at least minIntervalMs between calls (CJ allows 1/sec)", async () => {
    const times: number[] = []
    const { fn } = fakeFetch({
      "/authentication/getAccessToken": () => (times.push(Date.now()), tokenOk()),
      "/product/variant/query": () => (times.push(Date.now()), ok([])),
    })
    const c = new CjClient({ apiKey: "KEY", fetch: fn, minIntervalMs: 120 })
    await Promise.all([c.listVariants("a"), c.listVariants("b")])
    expect(times).toHaveLength(3)
    for (let i = 1; i < times.length; i++) {
      expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(110)
    }
  })
})

describe("CjDropshippingService.forwardOrder", () => {
  const order = {
    id: "order_1",
    display_id: 7,
    email: "a@b.nl",
    shipping_address: { first_name: "A", last_name: "B", address_1: "Straat 1", city: "Utrecht", postal_code: "3511AA", country_code: "nl" },
    items: [{ id: "item_1", quantity: 1, variant: { metadata: { cj_vid: "VID-1" } } }],
  }

  function service(handlers: Record<string, (body: any) => any>, opts: Partial<ConstructorParameters<typeof CjDropshippingService>[1]> = {}) {
    const { fn, calls } = fakeFetch({ "/authentication/getAccessToken": tokenOk, ...handlers })
    const s = new CjDropshippingService({}, { apiKey: "KEY", orderNumberPrefix: "jit", ...opts })
    ;(s as any).client = new CjClient({ apiKey: "KEY", fetch: fn, minIntervalMs: 0 })
    return { s, calls }
  }

  it("skips orders without CJ products", async () => {
    const { s, calls } = service({})
    const res = await s.forwardOrder({ ...order, items: [{ id: "i", quantity: 1, variant: { metadata: {} } }] })
    expect(res).toEqual({ status: "skipped", reason: expect.any(String) })
    expect(calls).toHaveLength(0)
  })

  it("picks the cheapest shipping method in time and creates the order", async () => {
    const created: any[] = []
    const { s } = service(
      {
        "/shopping/order/getOrderDetail": () => ({ code: 1603001, result: false, message: "not found" }),
        "/logistic/freightCalculate": () =>
          ok([
            { logisticName: "Fast", logisticAging: "3-5", logisticPrice: 20 },
            { logisticName: "Cheap", logisticAging: "8-12", logisticPrice: 5 },
          ]),
        "/shopping/order/createOrderV2": (body) => (created.push(body), ok({ orderId: "CJ-1", orderNumber: body.orderNumber, actualPayment: 12.5 })),
      },
      { maxDeliveryDays: 14 }
    )
    const res = await s.forwardOrder(order)
    expect(res).toEqual({
      status: "created",
      orders: [{ orderNumber: "jit-7", orderId: "CJ-1", logisticName: "Cheap", fromCountry: "CN", amountUsd: 12.5, alreadyExisted: false }],
    })
    expect(created[0]).toMatchObject({ orderNumber: "jit-7", logisticName: "Cheap", payType: 3, shippingCountryCode: "NL" })
  })

  it("does not create a duplicate when CJ already has the order", async () => {
    const { s, calls } = service({
      "/shopping/order/getOrderDetail": () => ok({ orderId: "CJ-9", orderNum: "jit-7", orderStatus: "UNSHIPPED", logisticName: "Cheap" }),
    })
    const res = await s.forwardOrder(order)
    expect(res).toMatchObject({ status: "created", orders: [{ orderId: "CJ-9", alreadyExisted: true }] })
    expect(calls.some((c) => c.url.includes("createOrderV2"))).toBe(false)
  })

  it("recovers when create fails because a parallel run created it", async () => {
    let detailCalls = 0
    const { s } = service({
      "/shopping/order/getOrderDetail": () =>
        ++detailCalls === 1 ? { code: 1603001, result: false, message: "not found" } : ok({ orderId: "CJ-2", orderNum: "jit-7", orderStatus: "CREATED" }),
      "/logistic/freightCalculate": () => ok([{ logisticName: "Cheap", logisticAging: "8-12", logisticPrice: 5 }]),
      "/shopping/order/createOrderV2": () => ({ code: 1603002, result: false, message: "ORDER_CODE_EXIST" }),
    })
    const res = await s.forwardOrder(order)
    expect(res).toMatchObject({ status: "created", orders: [{ orderId: "CJ-2", alreadyExisted: true }] })
  })

  it("uses a fixed cj_logistic without asking CJ for prices", async () => {
    const { s, calls } = service({
      "/shopping/order/getOrderDetail": () => ({ code: 1603001, result: false, message: "not found" }),
      "/shopping/order/createOrderV2": (body) => ok({ orderId: "CJ-3", orderNumber: body.orderNumber }),
    })
    await s.forwardOrder({ ...order, items: [{ id: "i", quantity: 1, variant: { metadata: { cj_vid: "V", cj_logistic: "PostNL" } } }] })
    expect(calls.some((c) => c.url.includes("freightCalculate"))).toBe(false)
    expect(JSON.parse(calls.find((c) => c.url.includes("createOrderV2"))!.init.body).logisticName).toBe("PostNL")
  })
})

describe("mapCjStatus", () => {
  it.each([
    ["UNPAID", "awaiting_payment"],
    ["CREATED", "awaiting_payment"],
    ["PROCESSING", "processing"],
    ["UNSHIPPED", "processing"],
    ["SHIPPED", "shipped"],
    ["DELIVERED", "delivered"],
    ["CANCELLED", "cancelled"],
    [undefined, "processing"],
  ])("%s → %s", (cj, ours) => {
    expect(mapCjStatus(cj as any)).toBe(ours)
  })
})
