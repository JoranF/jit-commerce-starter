import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { EXPERIMENTS } from "../src/config"

/**
 * Experiment-keys staan op twee plekken (storefront + analytics). Loopt dat uit de
 * pas, dan meet je niets of start je een test die de winkel niet kent. Deze test
 * laat CI falen, ook als de autopilot er één vergeet.
 */
const here = path.dirname(fileURLToPath(import.meta.url))
const constants = readFileSync(
  path.resolve(here, "../../apps/storefront/src/lib/analytics/constants.ts"),
  "utf8"
)
const block = constants.slice(constants.indexOf("export const EXPERIMENTS"))
const storefrontKeys = [...block.slice(0, block.indexOf("} as const")).matchAll(/:\s*"([a-z0-9-]+)"/g)].map((m) => m[1])

test("storefront en analytics kennen dezelfde experimenten", () => {
  assert.deepEqual([...storefrontKeys].sort(), EXPERIMENTS.map((e) => e.key).sort())
})

test("elk experiment heeft een control en minstens één andere variant", () => {
  for (const e of EXPERIMENTS) {
    const keys = e.variants.map((v) => v.key)
    assert.ok(keys.includes("control"), `${e.key} mist control`)
    assert.ok(keys.length >= 2, `${e.key} heeft maar één variant`)
    assert.ok(e.minDays >= 14 && e.minExposuresPerVariant >= 300, `${e.key}: te soepele beslisregels`)
  }
})
