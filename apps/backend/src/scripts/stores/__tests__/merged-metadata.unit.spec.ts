import { mergedMetadata } from "../setup-store"
import { STORE_SETUPS } from "../definitions"

describe("mergedMetadata", () => {
  it("adds the definition keys and keeps other keys", () => {
    expect(mergedMetadata({ note: "x" }, { cj_vid: "V" })).toEqual({ note: "x", cj_vid: "V" })
  })

  it("returns undefined when nothing changes (admin stores numbers as text)", () => {
    expect(mergedMetadata({ cj_vid: "V", cj_quantity: "2" }, { cj_vid: "V", cj_quantity: 2 })).toBeUndefined()
    expect(mergedMetadata({ a: 1 }, undefined)).toBeUndefined()
  })

  it("overwrites a changed value", () => {
    expect(mergedMetadata({ cj_vid: "OLD" }, { cj_vid: "NEW" })).toEqual({ cj_vid: "NEW" })
  })
})

describe("lichtval CJ link", () => {
  const variants = STORE_SETUPS.lichtval.product.variants
  it("links both variants to the same CJ vid, as text", () => {
    for (const v of variants) {
      expect(v.metadata?.cj_vid).toBe("2406160622081612300")
    }
  })
  it("sends two lamps to CJ for the Duo", () => {
    expect(variants.find((v) => v.sku === "LICHTVAL-WANDLAMP-DUO")?.metadata?.cj_quantity).toBe(2)
    expect(variants.find((v) => v.sku === "LICHTVAL-WANDLAMP")?.metadata?.cj_quantity).toBeUndefined()
  })
})
