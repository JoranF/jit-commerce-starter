import { businessDaysBetween, evaluateOrder, type CareOrder } from "../order-care"

const policy = { handling_days_max: 3, transit_days_min: 7, transit_days_max: 12 }
const base = (over: Partial<CareOrder> = {}): CareOrder => ({
  id: "order_1",
  display_id: 7,
  created_at: "2026-11-02T10:00:00Z", // maandag
  region: { metadata: policy },
  ...over,
})

describe("businessDaysBetween", () => {
  it("counts only weekdays", () => {
    expect(businessDaysBetween(new Date("2026-11-06T10:00:00Z"), new Date("2026-11-09T10:00:00Z"))).toBe(1) // vr → ma
    expect(businessDaysBetween(new Date("2026-11-02T10:00:00Z"), new Date("2026-11-16T10:00:00Z"))).toBe(10)
  })
})

describe("evaluateOrder", () => {
  it("flags orders that failed to go to CJ", () => {
    const r = evaluateOrder(base({ metadata: { cj_status: "error", cj_error: "Balance insufficient" } }), new Date("2026-11-02T13:00:00Z"))
    expect(r.issues.map((i) => i.kind)).toEqual(["cj_error"])
    expect(r.issues[0].message).toContain("Balance insufficient")
  })

  it("flags orders unpaid in CJ for 12+ hours", () => {
    const meta = { cj_status: "awaiting_payment", cj_forwarded_at: "2026-11-02T10:00:00Z" }
    expect(evaluateOrder(base({ metadata: meta }), new Date("2026-11-02T20:00:00Z")).issues).toHaveLength(0)
    expect(evaluateOrder(base({ metadata: meta }), new Date("2026-11-03T00:00:00Z")).issues[0].kind).toBe("cj_unpaid")
  })

  it("flags orders not shipped after handling time + 2 business days", () => {
    expect(evaluateOrder(base(), new Date("2026-11-06T10:00:00Z")).issues).toHaveLength(0) // 4 werkdagen
    expect(evaluateOrder(base(), new Date("2026-11-09T10:00:00Z")).issues).toHaveLength(0) // 5 werkdagen = 3 + 2
    expect(evaluateOrder(base(), new Date("2026-11-10T10:00:00Z")).issues[0].kind).toBe("not_shipped") // 6
  })

  it("sends the transit mail once, from the earliest expected day", () => {
    const shipped = base({ fulfillments: [{ shipped_at: "2026-11-04T10:00:00Z" }] })
    expect(evaluateOrder(shipped, new Date("2026-11-12T10:00:00Z")).sendTransitMail).toBe(false) // 6 werkdagen
    expect(evaluateOrder(shipped, new Date("2026-11-13T10:00:00Z")).sendTransitMail).toBe(true) // 7
    expect(
      evaluateOrder({ ...shipped, metadata: { care_transit_mail_at: "2026-11-13T07:17:00Z" } }, new Date("2026-11-16T10:00:00Z"))
        .sendTransitMail
    ).toBe(false)
  })

  it("flags parcels that take far too long, and stays quiet once delivered", () => {
    const shipped = base({ fulfillments: [{ shipped_at: "2026-11-04T10:00:00Z" }] })
    expect(evaluateOrder(shipped, new Date("2026-11-25T10:00:00Z")).issues).toHaveLength(0) // 15 werkdagen = 12 + 3
    expect(evaluateOrder(shipped, new Date("2026-11-26T10:00:00Z")).issues.map((i) => i.kind)).toEqual(["late_delivery"])
    expect(
      evaluateOrder({ ...shipped, metadata: { cj_status: "delivered" } }, new Date("2026-11-25T10:00:00Z"))
    ).toEqual({ issues: [], sendTransitMail: false })
  })

  it("ignores canceled orders", () => {
    expect(evaluateOrder(base({ status: "canceled", metadata: { cj_status: "error" } }), new Date())).toEqual({
      issues: [],
      sendTransitMail: false,
    })
  })
})
