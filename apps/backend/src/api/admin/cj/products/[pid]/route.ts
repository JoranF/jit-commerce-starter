import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { resolveCj } from "../../../../../modules/cj-dropshipping/lib/resolve"

/**
 * GET /admin/cj/products/:pid?to=NL — variants of a CJ product (vid, sku, price),
 * stock per warehouse country and shipping options to `to`. Use the vid as
 * `cj_vid` in the Medusa variant metadata.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cj = resolveCj(req.scope)
  if (!cj) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "CJ Dropshipping is not configured (CJ_API_KEY)")
  }
  const pid = req.params.pid
  const to = String(req.query.to ?? "NL").toUpperCase()
  const client = cj.getClient()

  const variants = await client.listVariants(pid)
  const inventory = await client.getInventoryByProduct(pid).catch(() => [])
  const shipping: Record<string, unknown> = {}
  const first = variants[0]
  if (first) {
    const origins = [...new Set(inventory.map((i) => i.countryCode).filter(Boolean))]
    for (const from of origins.length ? origins : [cj.options.defaultFromCountry]) {
      shipping[from] = await client
        .freightCalculate({ startCountryCode: from, endCountryCode: to, products: [{ vid: first.vid, quantity: 1 }] })
        .catch((e: Error) => ({ error: e.message }))
    }
  }

  res.json({
    pid,
    variants: variants.map((v) => ({
      vid: v.vid,
      sku: v.variantSku,
      name: v.variantNameEn ?? v.variantKey,
      price_usd: v.variantSellPrice,
      weight_g: v.variantWeight,
    })),
    inventory,
    shipping_to: to,
    shipping,
  })
}
