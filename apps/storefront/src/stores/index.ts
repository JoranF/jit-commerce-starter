import { lichtval } from "./lichtval"
import type { StoreConfig } from "./types"

export type { StoreConfig, StoreImage } from "./types"

/**
 * Alle winkels die deze storefront kan draaien. Nieuwe winkel: kopieer
 * lichtval.ts, pas merk/teksten/beelden aan en voeg hem hier toe.
 */
const STORES: Record<string, StoreConfig> = {
  [lichtval.id]: lichtval,
}

const id = (process.env.NEXT_PUBLIC_STORE_ID || lichtval.id).toLowerCase()

if (!STORES[id]) {
  throw new Error(
    `Onbekende winkel NEXT_PUBLIC_STORE_ID="${id}". Kies uit: ${Object.keys(STORES).join(", ")}`
  )
}

/** De actieve winkel (vast per build: NEXT_PUBLIC_STORE_ID). */
export const store: StoreConfig = STORES[id]

/** "#16323A" → "22 50 58" (voor Tailwind-kleuren met opacity). */
const toRgb = (hex: string) => {
  const h = hex.replace("#", "")
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/** CSS-variabelen voor de merkkleuren; gezet in de root layout. */
export const themeCss = (s: StoreConfig = store) => {
  const c = s.theme.colors
  const f = s.theme.fonts
  return `:root{--brand-dark:${toRgb(c.dark)};--brand-light:${toRgb(c.light)};--brand-ink:${toRgb(c.ink)};--brand-accent:${toRgb(c.accent)};--brand-muted:${toRgb(c.muted)};--font-display:"${f.display}";--font-body:"${f.body}"}`
}

export type PolicyValues = {
  verwerking?: string
  bezorging?: string
  levertijd?: string
  bedenktijd?: string
  /** "€ 4,95" of "gratis". */
  verzendkosten?: string
}

/**
 * Vult {levertijd}, {verwerking}, {bezorging}, {bedenktijd} en {verzendkosten} in. Zonder
 * winkelbeleid valt de zin met een ontbrekende waarde weg (null), zodat de site
 * nooit een lege of verzonnen termijn toont.
 */
export const fillPolicy = (text: string, values: PolicyValues): string | null => {
  let missing = false
  const out = text.replace(/\{(\w+)\}/g, (_, key: keyof PolicyValues) => {
    const v = values[key]
    if (!v) {
      missing = true
      return ""
    }
    return v
  })
  return missing ? null : out
}
