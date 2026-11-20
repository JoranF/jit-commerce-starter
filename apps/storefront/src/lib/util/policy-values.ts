import type { PolicyValues } from "@stores"
import type { StorePolicies } from "./store-policies"

const range = (min: number, max: number) => (min === max ? `${min}` : `${min}–${max}`)

/**
 * Winkelbeleid van de regio → waarden voor {verwerking}, {bezorging},
 * {levertijd} en {bedenktijd} in de teksten van de winkel.
 */
export const policyValues = (p: StorePolicies | null | undefined): PolicyValues =>
  p
    ? {
        verwerking: range(p.handlingDays.min, p.handlingDays.max),
        bezorging: range(p.transitDays.min, p.transitDays.max),
        levertijd: range(
          p.handlingDays.min + p.transitDays.min,
          p.handlingDays.max + p.transitDays.max
        ),
        bedenktijd: `${p.returnWindowDays}`,
      }
    : {}
