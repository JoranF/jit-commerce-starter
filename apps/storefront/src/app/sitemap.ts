import { sdk } from "@lib/config"
import { listRegions } from "@lib/data/regions"
import { getSiteOrigin, listCountryCodes } from "@lib/util/site"
import type { MetadataRoute } from "next"

const STATIC_PATHS = [
  "",
  "/store",
  "/shipping",
  "/returns",
  "/terms",
  "/privacy",
  "/contact",
]
const PAGE_SIZE = 200

type Page<T> = { items: T[]; count: number }

async function listAll<T>(fetchPage: (offset: number) => Promise<Page<T>>) {
  const all: T[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { items, count } = await fetchPage(offset)
    all.push(...items)
    if (offset + PAGE_SIZE >= count || !items.length) {
      return all
    }
  }
}

export const revalidate = 3600

async function safeAll<T extends readonly unknown[]>(
  promises: [...{ [K in keyof T]: Promise<T[K]> }]
): Promise<T> {
  const [origin, ...rest] = promises as Promise<unknown>[]
  const o = await origin
  try {
    return [o, ...(await Promise.all(rest))] as unknown as T
  } catch (e) {
    console.warn("sitemap: backend onbereikbaar, alleen vaste pagina's")
    return [o, ...rest.map(() => [])] as unknown as T
  }
}

type Entry = { handle?: string | null; updated_at?: string | Date | null }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const query = { fields: "handle,updated_at", limit: PAGE_SIZE }

  // Backend onbereikbaar tijdens de build (Docker/Dokploy)? Dan eerst alleen de
  // vaste pagina's; via `revalidate` wordt de sitemap daarna elk uur ververst.
  const [origin, regions, products, categories, collections] = await safeAll([
    getSiteOrigin(),
    listRegions(),
    listAll<Entry>((offset) =>
      sdk.store.product
        .list({ ...query, offset })
        .then((res) => ({ items: res.products, count: res.count }))
    ),
    listAll<Entry>((offset) =>
      sdk.store.category
        .list({ ...query, offset })
        .then((res) => ({ items: res.product_categories, count: res.count }))
    ),
    listAll<Entry>((offset) =>
      sdk.store.collection
        .list({ ...query, offset })
        .then((res) => ({ items: res.collections, count: res.count }))
    ),
  ])

  const toEntries = (base: string, prefix: string, items: Entry[]) =>
    items
      .filter((item) => item.handle)
      .map((item) => ({
        url: `${base}/${prefix}/${item.handle}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : undefined,
      }))

  return listCountryCodes(regions).flatMap((countryCode) => {
    const base = `${origin}/${countryCode}`
    return [
      ...STATIC_PATHS.map((path) => ({ url: `${base}${path}` })),
      ...toEntries(base, "products", products),
      ...toEntries(base, "categories", categories),
      ...toEntries(base, "collections", collections),
    ]
  })
}
