import fs from "node:fs"
import path from "node:path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  updateProductsWorkflow,
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
    fields: ["id", "status", "images.id", "variants.id"],
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
            thumbnail: images[0]?.url,
            images,
            shipping_profile_id: profile?.id,
            sales_channels: channel ? [{ id: channel.id }] : [],
            options: [{ title: "Uitvoering", values: ["Standaard"] }],
            variants: [
              {
                title: "Standaard",
                sku: p.sku,
                manage_inventory: false, // dropshipping: geen eigen voorraad
                options: { Uitvoering: "Standaard" },
                prices: [{ currency_code: "eur", amount: p.priceEur }],
                metadata: p.variantMetadata,
              },
            ],
          },
        ],
      },
    })
    log(`product "${p.title}" aangemaakt (€${p.priceEur}, ${images.length} foto's)`)
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
