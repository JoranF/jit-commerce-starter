import { MOLLIE_PROVIDER_IDS, wantedRegionProviders } from "../payment-providers"

const available = [...MOLLIE_PROVIDER_IDS, "pp_mollie-hosted-checkout_mollie", "pp_system_default"]

describe("wantedRegionProviders", () => {
  it("changes nothing without Mollie (local testing)", () => {
    expect(wantedRegionProviders(["pp_system_default"], { mollie: false, allowTest: false, available })).toBeNull()
  })

  it("replaces the test payment by Mollie when Mollie is configured", () => {
    expect(wantedRegionProviders(["pp_system_default"], { mollie: true, allowTest: false, available })).toEqual(
      MOLLIE_PROVIDER_IDS
    )
  })

  it("removes the test payment but keeps the merchant's own Mollie selection", () => {
    expect(
      wantedRegionProviders(["pp_mollie-ideal_mollie", "pp_system_default"], { mollie: true, allowTest: false, available })
    ).toEqual(["pp_mollie-ideal_mollie"])
  })

  it("keeps the test payment with ALLOW_TEST_PAYMENT", () => {
    expect(
      wantedRegionProviders(["pp_mollie-ideal_mollie", "pp_system_default"], { mollie: true, allowTest: true, available })
    ).toBeNull()
  })

  it("is idempotent", () => {
    expect(wantedRegionProviders(MOLLIE_PROVIDER_IDS, { mollie: true, allowTest: false, available })).toBeNull()
  })

  it("never leaves a region without payment methods", () => {
    expect(wantedRegionProviders(["pp_system_default"], { mollie: true, allowTest: false, available: [] })).toBeNull()
  })
})
