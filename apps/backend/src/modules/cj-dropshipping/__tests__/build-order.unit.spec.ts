import {
  buildCjOrder,
  chooseLogistic,
  cjOrderNumber,
  getCjLines,
  isPaidByRealProvider,
  maxDays,
  splitHouseNumber,
  type OrderLike,
} from "../lib/build-order"

const order = (over: Partial<OrderLike> = {}): OrderLike => ({
  id: "order_1",
  display_id: 1042,
  email: "klant@example.nl",
  shipping_address: {
    first_name: "Sanne",
    last_name: "de Vries",
    address_1: "Damrak 12a",
    city: "Amsterdam",
    postal_code: "1012 LG",
    country_code: "nl",
    phone: "0612345678",
  },
  items: [
    { id: "item_1", quantity: 2, variant: { metadata: { cj_vid: "VID-1" } } },
    { id: "item_2", quantity: 1, variant: { metadata: {} } }, // not a CJ product
    { id: "item_3", quantity: 1, variant: { metadata: {} }, product: { metadata: { cj_vid: "VID-3", cj_from_country: "de" } } },
  ],
  ...over,
})

describe("getCjLines", () => {
  it("keeps only CJ-linked items and falls back to product metadata", () => {
    expect(getCjLines(order())).toEqual([
      { vid: "VID-1", quantity: 2, itemQuantity: 2, storeLineItemId: "item_1", fromCountry: undefined, logistic: undefined },
      { vid: "VID-3", quantity: 1, itemQuantity: 1, storeLineItemId: "item_3", fromCountry: "DE", logistic: undefined },
    ])
  })

  it("variant metadata wins over product metadata", () => {
    const o = order({
      items: [
        {
          id: "i",
          quantity: 1,
          variant: { metadata: { cj_vid: "V" } },
          product: { metadata: { cj_vid: "P" } },
        },
      ],
    })
    expect(getCjLines(o)[0].vid).toBe("V")
  })

  it("multiplies by cj_quantity for set variants (Duo = 2 lamps at CJ)", () => {
    const o = order({
      items: [
        { id: "duo", quantity: 3, variant: { metadata: { cj_vid: "LAMP", cj_quantity: 2 } } },
        { id: "str", quantity: 1, variant: { metadata: { cj_vid: "LAMP", cj_quantity: "2" } } },
        { id: "bad", quantity: 1, variant: { metadata: { cj_vid: "LAMP", cj_quantity: "0" } } },
      ],
    })
    expect(getCjLines(o).map((l) => [l.storeLineItemId, l.quantity, l.itemQuantity])).toEqual([
      ["duo", 6, 3],
      ["str", 2, 1],
      ["bad", 1, 1],
    ])
  })

  it("buildCjOrder sends CJ units, not Medusa line quantities", () => {
    const o = order({
      items: [{ id: "duo", quantity: 1, variant: { metadata: { cj_vid: "LAMP", cj_quantity: 2 } } }],
    })
    const input = buildCjOrder(o, getCjLines(o), {
      logisticName: "CJPacket Ordinary",
      fromCountryCode: "CN",
      autoPay: false,
      sandbox: false,
    })
    expect(input.products).toEqual([{ vid: "LAMP", quantity: 2, storeLineItemId: "duo" }])
    // Neutraal verpakken staat standaard aan.
    expect(input.remark).toMatch(/no invoice, no prices/)
    expect(
      buildCjOrder(o, getCjLines(o), { logisticName: "X", fromCountryCode: "CN", autoPay: false, sandbox: false, remark: "" })
        .remark
    ).toBeUndefined()
  })
})

describe("isPaidByRealProvider", () => {
  it("blocks orders paid with the manual test payment", () => {
    expect(
      isPaidByRealProvider(order({ payment_collections: [{ payments: [{ provider_id: "pp_system_default" }] }] }))
    ).toBe(false)
  })

  it("blocks orders without any payment", () => {
    expect(isPaidByRealProvider(order({ payment_collections: [] }))).toBe(false)
    expect(isPaidByRealProvider(order({ payment_collections: [{ payments: [] }] }))).toBe(false)
  })

  it("allows Mollie payments, ignoring canceled ones", () => {
    expect(
      isPaidByRealProvider(
        order({ payment_collections: [{ payments: [{ provider_id: "pp_mollie-ideal_mollie" }] }] })
      )
    ).toBe(true)
    expect(
      isPaidByRealProvider(
        order({
          payment_collections: [
            { payments: [{ provider_id: "pp_mollie-ideal_mollie", canceled_at: "2026-11-22T10:00:00Z" }] },
          ],
        })
      )
    ).toBe(false)
  })

  it("does not block when payments were not loaded", () => {
    expect(isPaidByRealProvider(order())).toBe(true)
  })
})

describe("splitHouseNumber", () => {
  it.each([
    ["Damrak 12a", "Damrak", "12a"],
    ["Lange Voorhout 1", "Lange Voorhout", "1"],
    ["Kerkstraat 10-2", "Kerkstraat", "10-2"],
    ["Hoofdweg 123 B", "Hoofdweg", "123B"],
  ])("%s", (line, street, nr) => {
    expect(splitHouseNumber(line)).toEqual({ street, houseNumber: nr })
  })

  it("leaves lines without a trailing number alone", () => {
    expect(splitHouseNumber("Postbus")).toEqual({ street: "Postbus" })
  })
})

describe("chooseLogistic", () => {
  const options = [
    { logisticName: "CJPacket Ordinary", logisticAging: "10-15", logisticPrice: 4.5 },
    { logisticName: "YunExpress", logisticAging: "7-12", logisticPrice: 6.1 },
    { logisticName: "DHL", logisticAging: "3-5", logisticPrice: 25 },
    { logisticName: "Slow Boat", logisticAging: "20-40", logisticPrice: 1 },
  ]

  it("uses a preferred method when offered (case-insensitive)", () => {
    expect(chooseLogistic(options, ["nope", "yunexpress"])?.logisticName).toBe("YunExpress")
  })

  it("otherwise picks the cheapest within the max delivery days", () => {
    expect(chooseLogistic(options, [], 15)?.logisticName).toBe("CJPacket Ordinary")
    expect(chooseLogistic(options, [], 12)?.logisticName).toBe("YunExpress")
  })

  it("falls back to the fastest when nothing is in time", () => {
    expect(chooseLogistic(options, [], 2)?.logisticName).toBe("DHL")
  })

  it("returns undefined without options", () => {
    expect(chooseLogistic([], [])).toBeUndefined()
  })

  it("parses aging strings", () => {
    expect(maxDays("7-12")).toBe(12)
    expect(maxDays("5")).toBe(5)
    expect(maxDays(undefined)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe("buildCjOrder", () => {
  const opts = { logisticName: "YunExpress", fromCountryCode: "CN", autoPay: false, sandbox: true, orderNumberPrefix: "jit" }

  it("maps a Dutch address and order", () => {
    const o = order()
    const cj = buildCjOrder(o, getCjLines(o), opts)
    expect(cj).toMatchObject({
      orderNumber: "jit-1042",
      shippingCountryCode: "NL",
      shippingCountry: "Netherlands",
      shippingProvince: "Amsterdam", // no province in NL → city
      shippingCity: "Amsterdam",
      shippingZip: "1012 LG",
      shippingAddress: "Damrak 12a",
      houseNumber: "12a",
      shippingCustomerName: "Sanne de Vries",
      shippingPhone: "0612345678",
      email: "klant@example.nl",
      logisticName: "YunExpress",
      fromCountryCode: "CN",
      payType: 3,
      isSandbox: 1,
    })
    expect(cj.products).toEqual([
      { vid: "VID-1", quantity: 2, storeLineItemId: "item_1" },
      { vid: "VID-3", quantity: 1, storeLineItemId: "item_3" },
    ])
  })

  it("uses payType 2 when autoPay is on", () => {
    const o = order()
    expect(buildCjOrder(o, getCjLines(o), { ...opts, autoPay: true }).payType).toBe(2)
  })

  it("throws without a complete address", () => {
    const o = order({ shipping_address: { country_code: "nl" } })
    expect(() => buildCjOrder(o, getCjLines(o), opts)).toThrow(/shipping address/)
  })

  it("builds a stable order number", () => {
    expect(cjOrderNumber({ id: "order_x", display_id: 7 }, "shop")).toBe("shop-7")
    expect(cjOrderNumber({ id: "order_x" })).toBe("medusa-order_x")
  })
})
