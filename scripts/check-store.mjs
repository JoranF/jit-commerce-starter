#!/usr/bin/env node
/**
 * Klaar voor livegang? `pnpm check-store <id>` controleert een winkel:
 *  - TODO's in de storefront-config, backend-definitie en analytics-config
 *  - beelden die ontbreken of nog placeholders zijn
 *  - bedrijfsgegevens (wettelijk verplicht)
 *  - PostHog-project, Meta-account en break-even CPA voor de automatisering
 *
 * Exit-code 1 als er iets blokkeert, zodat je hem ook in CI kunt draaien.
 */
import { existsSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const id = process.argv[2]?.toLowerCase()
if (!id) {
  console.error("Gebruik: pnpm check-store <id>")
  process.exit(1)
}

const errors = []
const warnings = []
const read = (p) => (existsSync(path.join(root, p)) ? readFileSync(path.join(root, p), "utf8") : null)

// Storefront-config
const configPath = `apps/storefront/src/stores/${id}.ts`
const config = read(configPath)
if (!config) {
  errors.push(`${configPath} bestaat niet (maak hem met: pnpm new-store ${id})`)
} else {
  const todos = config.split("\n").filter((l) => l.includes("TODO") && !l.trim().startsWith("*") && !l.trim().startsWith("//"))
  if (todos.length) errors.push(`${configPath}: ${todos.length} TODO('s) in teksten:\n${todos.slice(0, 8).map((l) => `      ${l.trim()}`).join("\n")}`)
  if (!read("apps/storefront/src/stores/index.ts")?.includes(`from "./${id}"`)) {
    errors.push(`apps/storefront/src/stores/index.ts: winkel niet geregistreerd`)
  }
  const company = config.match(/company:\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? ""
  for (const field of ["legalName", "kvk", "address", "email"]) {
    if (!new RegExp(`${field}:\\s*"[^"]+"`).test(company)) errors.push(`company.${field} ontbreekt (wettelijk verplicht)`)
  }
  if (/email:\s*"[^"]+@(gmail|hotmail|outlook|live|yahoo)\./.test(company)) {
    warnings.push("company.email is een privé-adres: een adres op je eigen domein wekt meer vertrouwen")
  }
  // GPSR (EU 2023/988): fabrikant + verantwoordelijke in de EU op de productpagina.
  const code = config.replace(/^\s*\/\/.*$/gm, "")
  if (!/productSafety:\s*\{/.test(code)) {
    errors.push("productSafety ontbreekt: fabrikant en verantwoordelijke in de EU (GPSR) zijn verplicht op de productpagina")
  }
  for (const src of config.matchAll(/src:\s*"([^"]+)"/g)) {
    const file = path.join(root, "apps/storefront/public", src[1])
    if (!existsSync(file)) errors.push(`beeld ontbreekt: public${src[1]}`)
    else if (statSync(file).size < 2000) warnings.push(`placeholder-beeld: public${src[1]}`)
  }
}

// Backend
const defs = read("apps/backend/src/scripts/stores/definitions.ts") ?? ""
const block = defs.split(/\n  "?([a-z0-9-]+)"?: \{\n/).reduce((acc, part, i, arr) => (arr[i - 1] === id ? part : acc), "")
if (!block) errors.push(`definitions.ts: geen STORE_SETUPS["${id}"]`)
else {
  const todos = (block.match(/TODO/g) ?? []).length
  if (todos) errors.push(`definitions.ts (${id}): ${todos} TODO('s) (productnaam, omschrijving, foto's, levertijden)`)
  for (const file of block.matchAll(/file:\s*"([^"]+)"/g)) {
    const p = path.join(root, `apps/backend/src/scripts/assets/${id}/${file[1]}`)
    if (!existsSync(p)) errors.push(`productfoto ontbreekt: src/scripts/assets/${id}/${file[1]}`)
    else if (statSync(p).size < 2000) warnings.push(`placeholder-productfoto: src/scripts/assets/${id}/${file[1]}`)
  }
  if (!/cj_vid/.test(block.replace(/\/\/.*$/gm, ""))) warnings.push("geen cj_vid in de varianten: bestellingen gaan niet automatisch naar CJ")
}

// Analytics
const analytics = read("analytics/src/stores.ts") ?? ""
const aBlock = analytics.split("\n  {\n").find((b) => b.includes(`id: "${id}"`)) ?? ""
if (!aBlock) errors.push(`analytics/src/stores.ts: winkel ontbreekt`)
else {
  if (/posthogProjectId:\s*""/.test(aBlock)) warnings.push("geen PostHog-project: A/B-tests en rapporten draaien niet voor deze winkel")
  if (/adAccountId:\s*""/.test(aBlock)) warnings.push("geen Meta-advertentieaccount: ads-automatisering staat uit")
  if (/breakEvenCpa:\s*0\b/.test(aBlock)) warnings.push("breakEvenCpa is 0: vul de rekensom in docs/beslissingen in")
}

console.log(`\nWinkel ${id}\n`)
for (const e of errors) console.log(`  ✗ ${e}`)
for (const w of warnings) console.log(`  ⚠ ${w}`)
if (!errors.length && !warnings.length) console.log("  ✓ Alles ingevuld.")
console.log(errors.length ? `\n${errors.length} blokkerend, ${warnings.length} waarschuwing(en).` : `\nKlaar voor livegang (${warnings.length} waarschuwing(en)).`)
process.exit(errors.length ? 1 : 0)
