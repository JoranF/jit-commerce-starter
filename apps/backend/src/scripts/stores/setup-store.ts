import fs from "node:fs"
import path from "node:path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  createProductVariantsWorkflow,
  updateProductOptionsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
  updateRegionsWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"
import { STORE_SETUPS, type StoreSetup } from "./definitions"

/** Demo-producten van de starter (initiële seed + seed-demo-products). */
const isDemoHandle = (handle?: string | null) =>
  !!handle && (["t-shirt", "sweatshirt", "sweatpants", "shorts"].includes(handle) || handle.startsWith("demo-"))

/** Bestanden staan in src/scripts/assets/<id>/ (lokaal én in de Docker-image). */
const assetDir = (id: string) => {
  const candidates = [
    path.join(process.cwd(), "src/scripts/assets", id),
    path.join(__dirname, "../assets", id),
  ]
  return candidates.find((dir) => fs.existsSync(dir))
}

async function uploadImages(container: ExecArgs["container"], setup: StoreSetup) {
  const dir = assetDir(setup.id)
  if (!dir) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Geen foto's gevonden voor "${setup.id}" in src/scripts/assets/${setup.id}`
    )
  }
  const { result } = await uploadFilesWorkflow(container).run({
    input: {
      files: setup.product.images.map((img) => ({
        filename: `${setup.id}-${img.file}`,
        mimeType: img.file.endsWith(".png") ? "image/png" : "image/jpeg",
        content: fs.readFileSync(path.join(dir, img.file)).toString("base64"),
        access: "public" as const,
      })),
    },
  })
  return result.map((file, i) => ({ url: file.url, metadata: { alt: setup.product.images[i].alt } }))
}

type ExistingProduct = {
  id: string
  options?: { id: string; title: string; values?: { value: string }[] | null }[] | null
  variants?: { id: string; sku?: string | null }[] | null
}

/**
 * Brengt de varianten van een bestaand product in lijn met de definitie:
 * optie hernoemen/aanvullen, bekende varianten (op SKU) de juiste optiewaarde
 * geven en ontbrekende varianten aanmaken. Prijzen van bestaande varianten
 * blijven ongemoeid (die beheer je in de admin).
 */
async function syncVariants(
  container: ExecArgs["container"],
  product: ExistingProduct,
  setup: StoreSetup,
  log: (msg: string) => void
) {
  const p = setup.product
  const option = product.options?.[0]
  if (!option || (product.options?.length ?? 0) > 1) {
    log("varianten niet bijgewerkt: verwacht precies één productoptie, pas ze aan in de admin")
    return
  }
  const wanted = p.variants.map((v) => v.title)
  const ranks = Object.fromEntries(wanted.map((v, i) => [v, i]))
  const currentValues = (option.values ?? []).map((v) => v.value)
  const variants = product.variants ?? []
  const missing = p.variants.filter((v) => !variants.some((pv) => pv.sku === v.sku))
  const unknown = variants.filter((pv) => !p.variants.some((v) => v.sku === pv.sku))
  const stale = currentValues.filter((v) => !wanted.includes(v))
  const optionOk =
    option.title === p.optionTitle && wanted.every((w) => currentValues.includes(w)) && !stale.length
  if (optionOk && !missing.length) return

  // 1. Optie hernoemen en nieuwe waarden toevoegen (oude blijven tot de varianten om zijn).
  await updateProductOptionsWorkflow(container).run({
    input: {
      selector: { id: option.id },
      update: { title: p.optionTitle, values: [...new Set([...wanted, ...currentValues])], ranks },
    },
  })

  // 2. Bekende varianten de nieuwe optiewaarde geven.
  for (const pv of variants) {
    const def = p.variants.find((v) => v.sku === pv.sku)
    if (!def) continue
    await updateProductVariantsWorkflow(container).run({
      input: {
        selector: { id: pv.id },
        update: { title: def.title, options: { [p.optionTitle]: def.title } },
      },
    })
  }

  // 3. Ontbrekende varianten aanmaken.
  if (missing.length) {
    await createProductVariantsWorkflow(container).run({
      input: {
        product_variants: missing.map((v) => ({
          product_id: product.id,
          title: v.title,
          sku: v.sku,
          manage_inventory: false, // dropshipping: geen eigen voorraad
          options: { [p.optionTitle]: v.title },
          prices: [{ currency_code: "eur", amount: v.priceEur }],
          metadata: v.metadata,
        })),
      },
    })
  }

  // 4. Oude optiewaarden weghalen, tenzij een onbekende variant ze nog gebruikt.
  if (stale.length && !unknown.length) {
    await updateProductOptionsWorkflow(container).run({
      input: { selector: { id: option.id }, update: { values: wanted, ranks } },
    })
  }
  log(
    `varianten bijgewerkt (${missing.length} toegevoegd: ${missing.map((v) => v.title).join(", ") || "geen"}` +
      `${unknown.length ? `; ${unknown.length} onbekende variant(en) laten staan` : ""})`
  )
}

/**
 * Eenmalige update van een bestaand product als `product.revision` hoger is dan de
 * revisie in de metadata: foto's vervangen en variantprijzen op de definitie zetten.
 */
async function applyRevision(
  container: ExecArgs["container"],
  product: ExistingProduct & { metadata?: Record<string, unknown> | null },
  setup: StoreSetup,
  log: (msg: string) => void
) {
  const p = setup.product
  const wanted = p.revision ?? 0
  const current = Number(product.metadata?.store_setup_revision ?? 0)
  if (wanted <= current) return

  const images = await uploadImages(container, setup)
  await updateProductsWorkflow(container).run({
    input: {
      selector: { id: product.id },
      update: {
        images,
        thumbnail: images[0]?.url,
        metadata: { ...(product.metadata ?? {}), store_setup_revision: wanted },
      },
    },
  })

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku"],
    filters: { product_id: product.id },
  })
  for (const v of variants) {
    const def = p.variants.find((d) => d.sku === v.sku)
    if (!def) continue
    await updateProductVariantsWorkflow(container).run({
      input: {
        selector: { id: v.id },
        update: { prices: [{ currency_code: "eur", amount: def.priceEur }] },
      },
    })
  }
  log(
    `revisie ${current} → ${wanted}: ${images.length} foto's vervangen, prijzen gezet (` +
      p.variants.map((v) => `${v.title} €${v.priceEur}`).join(", ") +
      ")"
  )
}

/**
 * Zet een winkel klaar in Medusa: winkelbeleid per regio, omschrijving van de
 * standaard verzending, het product (met foto's) en optioneel de demo-producten
 * op concept. Idempotent: opnieuw draaien maakt niets dubbel.
 *
 *   pnpm medusa exec ./src/scripts/stores/setup-store.ts lichtval
 */
export default async function setupStore({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const id = (args?.[0] || process.env.STORE_ID || "").toLowerCase()
  const setup = STORE_SETUPS[id]
  if (!setup) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Onbekende winkel "${id}". Kies uit: ${Object.keys(STORE_SETUPS).join(", ")}`
    )
  }
  const log = (msg: string) => logger.info(`[store:${setup.id}] ${msg}`)

  // 1. Winkelbeleid (levertijden, bedenktijd) in de metadata van elke regio.
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "name", "metadata"] })
  for (const region of regions) {
    const metadata = { ...(region.metadata ?? {}), ...setup.policies }
    await updateRegionsWorkflow(container).run({
      input: { selector: { id: region.id }, update: { metadata } },
    })
  }
  log(`winkelbeleid gezet op ${regions.length} regio('s)`)

  // 2. Verzendopties: naam/omschrijving van "standaard", en opties die niet
  //    kloppen voor deze winkel (bv. express "volgende dag") verbergen.
  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "type.code", "type.id", "type.description", "rules.id", "rules.attribute", "rules.value"],
  })
  for (const option of options) {
    const code = option.type?.code
    if (code === "standard" && setup.standardShipping) {
      const { name, description } = setup.standardShipping
      if (name && option.name !== name) {
        await fulfillment.updateShippingOptions(option.id, { name })
      }
      if (description && option.type && option.type.description !== description) {
        await fulfillment.updateShippingOptionTypes(option.type.id, { description })
      }
    }
    if (code && setup.hideShippingCodes?.includes(code)) {
      const rule = option.rules?.find((r) => r?.attribute === "enabled_in_store")
      // value kan als JSON-string opgeslagen zijn ('"true"').
      if (rule && String(rule.value).replace(/"/g, "") !== "false") {
        await fulfillment.updateShippingOptionRules([
          { id: rule.id, attribute: "enabled_in_store", operator: "eq", value: "false" },
        ])
      }
    }
  }
  log(`verzendopties bijgewerkt (${options.length} bekeken${setup.hideShippingCodes?.length ? `, verborgen: ${setup.hideShippingCodes.join(", ")}` : ""})`)

  // 3. Het product.
  const { product: p } = setup
  const { data: existing } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "status",
      "metadata",
      "images.id",
      "variants.id",
      "variants.sku",
      "options.id",
      "options.title",
      "options.values.value",
    ],
    filters: { handle: p.handle },
  })

  if (!existing.length) {
    const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id", "name"] })
    const channel = channels.find((c) => c.name === "Default Sales Channel") ?? channels[0]
    const [profile] = await fulfillment.listShippingProfiles({ type: "default" })
    const images = await uploadImages(container, setup)

    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: p.title,
            subtitle: p.subtitle,
            handle: p.handle,
            description: p.description,
            status: ProductStatus.PUBLISHED,
            metadata: { store_setup_revision: p.revision ?? 0 },
            thumbnail: images[0]?.url,
            images,
            shipping_profile_id: profile?.id,
            sales_channels: channel ? [{ id: channel.id }] : [],
            options: [{ title: p.optionTitle, values: p.variants.map((v) => v.title) }],
            variants: p.variants.map((v) => ({
              title: v.title,
              sku: v.sku,
              manage_inventory: false, // dropshipping: geen eigen voorraad
              options: { [p.optionTitle]: v.title },
              prices: [{ currency_code: "eur", amount: v.priceEur }],
              metadata: v.metadata,
            })),
          },
        ],
      },
    })
    log(
      `product "${p.title}" aangemaakt (${p.variants.map((v) => `${v.title} €${v.priceEur}`).join(", ")}, ${images.length} foto's)`
    )
  } else {
    const current = existing[0]
    const update: Record<string, unknown> = {
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
    }
    if (!current.images?.length) {
      const images = await uploadImages(container, setup)
      update.images = images
      update.thumbnail = images[0]?.url
    }
    await updateProductsWorkflow(container).run({
      input: { selector: { id: current.id }, update },
    })
    log(`product "${p.title}" bestond al: teksten bijgewerkt (prijs en voorraad beheer je in de admin)`)
    await syncVariants(container, current as ExistingProduct, setup, log)
    await applyRevision(container, current as ExistingProduct & { metadata?: Record<string, unknown> | null }, setup, log)
  }

  // 4. Demo-producten van de starter op concept (niet verwijderen).
  if (setup.hideDemoProducts) {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "status"],
      filters: { status: ProductStatus.PUBLISHED },
    })
    const demo = products.filter((prod) => isDemoHandle(prod.handle))
    if (demo.length) {
      await updateProductsWorkflow(container).run({
        input: { selector: { id: demo.map((d) => d.id) }, update: { status: ProductStatus.DRAFT } },
      })
    }
    log(`${demo.length} demo-product(en) op concept gezet`)
  }
}
