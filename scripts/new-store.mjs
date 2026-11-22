#!/usr/bin/env node
/**
 * Nieuwe winkel in één commando:
 *
 *   pnpm new-store <id> "<Naam>" [--handle <product-handle>] [--price <eur>]
 *
 * Maakt en registreert alles wat een winkel nodig heeft, met TODO's waar jij
 * iets moet invullen:
 *   apps/storefront/src/stores/<id>.ts          merk, teksten, beelden, FAQ, angles
 *   apps/storefront/public/stores/<id>/         beelden van de site (placeholders)
 *   apps/backend/src/scripts/stores/definitions.ts   product, prijs, levertijden
 *   apps/backend/src/scripts/assets/<id>/       productfoto's (placeholders)
 *   analytics/src/stores.ts                     PostHog-project, Meta-account, break-even
 *   docs/beslissingen/<id>.md                   rekensom + checklist voor livegang
 *   marketing/<id>/                             advertentiebeelden
 *
 * Daarna: `pnpm check-store <id>` laat zien wat er nog ontbreekt.
 * Idempotent: bestaande bestanden en registraties blijven staan.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { deflateSync } from "node:zlib"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  return i > -1 ? args[i + 1] : undefined
}
const positional = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"))
const [rawId, rawName] = positional

if (!rawId) {
  console.error('Gebruik: pnpm new-store <id> "<Naam>" [--handle <product-handle>] [--price <eur>]')
  process.exit(1)
}
const id = rawId.toLowerCase()
if (!/^[a-z][a-z0-9-]{1,30}$/.test(id)) {
  console.error(`✗ Ongeldige id "${rawId}": kleine letters, cijfers en -, begint met een letter.`)
  process.exit(1)
}
const name = rawName || id.charAt(0).toUpperCase() + id.slice(1)
const handle = flag("handle") || `${id}-product`
const price = Number(flag("price") || 49)
const camel = id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())

const rel = (p) => path.relative(root, p)
const created = []
const skipped = []

function write(file, content) {
  if (existsSync(file)) return skipped.push(rel(file))
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
  created.push(rel(file))
}

/** Voegt `text` in vóór de marker, als `needle` er nog niet in staat. */
function insertAt(file, marker, text, needle) {
  const s = readFileSync(file, "utf8")
  if (s.includes(needle)) return skipped.push(`${rel(file)} (${id} staat er al in)`)
  if (!s.includes(marker)) throw new Error(`Marker "${marker}" niet gevonden in ${rel(file)}`)
  writeFileSync(file, s.replace(marker, `${text}${marker}`))
  created.push(`${rel(file)} (bijgewerkt)`)
}

// ── Placeholder-beelden: effen PNG in de merkkleur (geen dependencies) ──────────
function png(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const w = 16
  const h = 16
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0
    for (let x = 0; x < w; x++) raw.set([r, g, b], y * (w * 3 + 1) + 1 + x * 3)
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  const crc = (buf) => {
    let c = 0xffffffff
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const c = Buffer.alloc(4)
    c.writeUInt32BE(crc(td))
    return Buffer.concat([len, td, c])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr.set([8, 2, 0, 0, 0], 8)
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

const colors = { dark: "#1F2A33", light: "#F2F0EB", ink: "#1A1F24", accent: "#E8B86B", muted: "#66707A" }
const siteImages = ["hero-breed", "hero-mobiel", "detail", "kamer-1", "kamer-2", "kamer-3", "product"]
for (const img of siteImages) {
  write(path.join(root, `apps/storefront/public/stores/${id}/${img}.png`), png(colors.dark))
}
for (const img of ["1-product"]) {
  write(path.join(root, `apps/backend/src/scripts/assets/${id}/${img}.png`), png(colors.dark))
}

// ── Storefront-config ─────────────────────────────────────────────────────────
const img = (file, alt, width, height) =>
  `{ src: "/stores/${id}/${file}.png", alt: "${alt}", width: ${width}, height: ${height} }`

write(
  path.join(root, `apps/storefront/src/stores/${id}.ts`),
  `import type { StoreConfig } from "./types"

/**
 * ${name}: winkel met één product. Gemaakt met \`pnpm new-store ${id}\`.
 *
 * Alles met TODO moet je invullen; \`pnpm check-store ${id}\` laat zien wat er
 * nog openstaat. Voorbeeld van een volledige winkel: lichtval.ts.
 * Beelden in public/stores/${id}/ zijn effen placeholders: vervang ze (fal.ai,
 * zie CLAUDE.md) en pas width/height aan.
 */
export const ${camel}: StoreConfig = {
  id: "${id}",
  name: "${name}",
  tagline: "TODO: één zin over de winkel (footer, meta description).",
  catalog: false,
  productHandle: "${handle}",

  theme: {
    // TODO: merkkleuren (skill frontend-design). Lettertypen: zie fonts.ts.
    colors: {
      dark: "${colors.dark}",
      light: "${colors.light}",
      ink: "${colors.ink}",
      accent: "${colors.accent}",
      muted: "${colors.muted}",
    },
    fonts: { display: "Hedvig Letters Serif", body: "Schibsted Grotesk Variable" },
  },

  seo: {
    title: "${name} | TODO: wat je verkoopt",
    description: "TODO: 1–2 zinnen voor Google (max. ~155 tekens).",
  },

  hero: {
    title: "TODO: kop van de hero.",
    lead: "TODO: één of twee zinnen die zeggen wat het is en waarom je het wilt.",
    cta: "Bekijk het product",
    wide: ${img("hero-breed", "TODO: beschrijf het beeld", 2400, 1340)},
    tall: ${img("hero-mobiel", "TODO: beschrijf het beeld", 1290, 2311)},
    lightOrigin: { wide: { x: 70, y: 45 }, tall: { x: 55, y: 35 } },
  },

  intro: {
    title: "TODO: tussenkop.",
    body: "TODO: een korte alinea over het product.",
    image: ${img("detail", "TODO: beschrijf het beeld", 1500, 1500)},
  },

  rooms: {
    title: "TODO: waar of hoe je het gebruikt",
    items: [
      { image: ${img("kamer-1", "TODO", 1500, 1862)}, title: "TODO", body: "TODO" },
      { image: ${img("kamer-2", "TODO", 1500, 1862)}, title: "TODO", body: "TODO" },
      { image: ${img("kamer-3", "TODO", 1500, 1862)}, title: "TODO", body: "TODO" },
    ],
  },

  buy: {
    title: "TODO: productnaam",
    image: ${img("product", "TODO: beschrijf het product", 1600, 1600)},
    // Alleen feiten die kloppen met het echte product.
    facts: [{ label: "TODO", value: "TODO" }],
    promises: [
      "In huis binnen {levertijd} werkdagen, met track & trace",
      "Verzendkosten {verzendkosten}, betalen met iDEAL",
      "{bedenktijd} dagen bedenktijd",
      "2 jaar garantie",
    ],
    ctaText: { control: "In winkelmand", test: "TODO: alternatieve knoptekst (A/B-test)" },
  },

  faq: {
    title: "Vragen",
    items: [
      {
        q: "Wanneer is mijn bestelling in huis?",
        a: "We versturen je bestelling binnen {verwerking} werkdagen. Daarna duurt de bezorging {bezorging} werkdagen. Zodra hij onderweg is, krijg je een track & trace-code per e-mail.",
      },
      {
        q: "Kan ik het terugsturen?",
        a: "Ja. Je hebt {bedenktijd} dagen bedenktijd na ontvangst. Stuur ons een e-mail, dan regelen we de retour. De verzendkosten voor het terugsturen zijn voor jou; je krijgt je geld terug zodra het pakket bij ons is.",
      },
      {
        q: "Hoe betaal ik?",
        a: "Je betaalt veilig via Mollie, bijvoorbeeld met iDEAL, Bancontact of creditcard.",
      },
    ],
  },

  // Invalshoeken voor advertenties: angle=<key> in de advertentie-URL (zie README → Advertenties).
  angles: {
    standaard: { label: "Standaard" },
  },

  imageNote: "Sfeerbeelden. Het product dat je ontvangt kan in afwerking licht afwijken.",

  // TODO: wettelijk verplicht (KvK, adres, e-mail). Zie lichtval.ts.
  company: {},
}
`
)

const storeIndex = path.join(root, "apps/storefront/src/stores/index.ts")
insertAt(storeIndex, "// new-store:import", `import { ${camel} } from "./${id}"\n`, `from "./${id}"`)
insertAt(storeIndex, "  // new-store:register", `  [${camel}.id]: ${camel},\n`, `[${camel}.id]`)

// ── Backend: product + winkelbeleid ───────────────────────────────────────────
insertAt(
  path.join(root, "apps/backend/src/scripts/stores/definitions.ts"),
  "  // new-store:insert",
  `  "${id}": {
    id: "${id}",
    product: {
      handle: "${handle}",
      title: "TODO: productnaam",
      description: "TODO: productomschrijving (wordt ook gebruikt voor Google en AI-zoekmachines).",
      images: [{ file: "1-product.png", alt: "TODO: beschrijf de foto" }],
      optionTitle: "Uitvoering",
      variants: [
        // metadata: { cj_vid: "..." } zodra de CJ-variant bekend is (dropshipping).
        { title: "Standaard", sku: "${id.toUpperCase()}-1", priceEur: ${price} },
      ],
    },
    // TODO: levertijden van de leverancier (EU-magazijn = veel korter).
    policies: {
      return_window_days: 14,
      free_returns: false,
      shipping_rate: 4.95,
      handling_days_min: 1,
      handling_days_max: 3,
      transit_days_min: 7,
      transit_days_max: 12,
    },
    standardShipping: {
      name: "Verzending met track & trace",
      description: "Met track & trace.",
    },
    hideShippingCodes: ["express"],
    hideDemoProducts: true,
  },
`,
  `"${id}": {`
)

// ── Analytics + advertenties ──────────────────────────────────────────────────
insertAt(
  path.join(root, "analytics/src/stores.ts"),
  "  // new-store:insert",
  `  {
    id: "${id}",
    name: "${name}",
    // TODO: maak een PostHog-project (eu.posthog.com) en zet het ID hier.
    posthogProjectId: "",
    meta: {
      // TODO: advertentieaccount "act_..." (leeg = geen ads-automatisering).
      adAccountId: "",
      // TODO: rekensom in docs/beslissingen/${id}.md.
      breakEvenCpa: 0,
      expectedOrderValue: ${price},
    },
  },
`,
  `id: "${id}"`
)

// ── Beslissingen + checklist ──────────────────────────────────────────────────
write(
  path.join(root, `docs/beslissingen/${id}.md`),
  `# ${name}: genomen beslissingen

Logboek van de keuzes voor ${name}. Voorbeeld: [lichtval.md](./lichtval.md).

## Product en leverancier

| Keuze | Waarde |
|---|---|
| Product | TODO (skill product-research-nl) |
| Leverancier | TODO |
| Inkoop incl. verzending naar NL | TODO |
| Levertijd | TODO → \`policies\` in \`apps/backend/src/scripts/stores/definitions.ts\` |

## Prijs en break-even

| | |
|---|---|
| Verkoopprijs (incl. btw) | €${price} |
| Zonder btw (÷ 1,21) | €${(price / 1.21).toFixed(2).replace(".", ",")} |
| Inkoop | TODO |
| Betaalkosten + retourreserve (≈ 4%) | TODO |
| **Max. advertentiekosten per verkoop (break-even CPA)** | **TODO** → \`breakEvenCpa\` in \`analytics/src/stores.ts\` |

## Checklist livegang

- [ ] Teksten, beelden en feiten ingevuld (\`pnpm check-store ${id}\` geeft geen TODO's meer)
- [ ] Bedrijfsgegevens (\`company\`) ingevuld
- [ ] Dokploy: services \`${id}-db\`, \`${id}-redis\`, \`${id}-backend\`, \`${id}-storefront\` met \`STORE_ID=${id}\` (README → Live zetten)
- [ ] Mollie live-key, testbestelling + terugbetaling
- [ ] PostHog-project aangemaakt, ID in \`analytics/src/stores.ts\`, \`POSTHOG_EVENTS_KEY\` / \`NEXT_PUBLIC_POSTHOG_KEY\` gezet
- [ ] \`cd analytics && npm run setup -- --store ${id}\` (dashboard + experimenten)
- [ ] Meta: pixel + CAPI (README → Meta), advertentieaccount en break-even in \`analytics/src/stores.ts\`
- [ ] Advertenties met URL-parameters (README → Advertenties)
- [ ] Dropshipping: \`cj_vid\` in de variant-metadata, \`CJ_API_KEY\` op de backend
`
)

write(path.join(root, `marketing/${id}/.gitkeep`), "")

console.log(`\n✅ Winkel "${name}" (${id})\n`)
if (created.length) console.log("Aangemaakt/bijgewerkt:\n" + created.map((f) => `  + ${f}`).join("\n"))
if (skipped.length) console.log("\nAl aanwezig (niet aangeraakt):\n" + skipped.map((f) => `  · ${f}`).join("\n"))
console.log(`
Volgende stappen:
  1. Vul de TODO's in en vervang de placeholder-beelden; controleer met: pnpm check-store ${id}
  2. Lokaal bekijken:  NEXT_PUBLIC_STORE_ID=${id} pnpm --filter @dtc/storefront dev
     en de backend:    cd apps/backend && pnpm medusa exec ./src/scripts/stores/setup-store.ts ${id}
  3. Livegang: checklist in docs/beslissingen/${id}.md
`)
