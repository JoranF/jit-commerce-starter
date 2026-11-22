/**
 * Winkels voor de automatisering. Elke winkel heeft een eigen PostHog-project
 * (eigen data, eigen feature flags, zelfde event-namen en experiment-keys) en
 * optioneel een eigen Meta-advertentieaccount.
 *
 * Nieuwe winkel: `pnpm new-store <id>` voegt hier een regel toe. Vul daarna
 * posthogProjectId (en meta) in; de GitHub-workflows nemen hem dan vanzelf mee.
 *
 * Kies een winkel in de scripts met `--store <id>` of `STORE_ID=<id>`.
 */
export type StoreAnalytics = {
  /** Gelijk aan apps/storefront/src/stores/<id>.ts en STORE_ID. */
  id: string
  name: string
  /** PostHog project-ID (eu.posthog.com/project/<id>). Leeg = winkel doet nog niet mee. */
  posthogProjectId: string
  /** Experimenten (keys uit config.EXPERIMENTS) die bij deze winkel horen. Leeg = alle. */
  experiments?: string[]
  /** Meta-advertenties (scripts `npm run ads`). Leeg = geen ads-automatisering. */
  meta?: {
    /** Advertentieaccount, bv. "act_1234567890". */
    adAccountId: string
    /**
     * Maximale advertentiekosten per verkoop (EUR) waarbij je quitte speelt.
     * Rekensom per winkel in docs/beslissingen/<id>.md.
     */
    breakEvenCpa: number
    /** Gemiddelde omzet per bestelling incl. btw als er nog geen data is (EUR). */
    expectedOrderValue?: number
  }
}

export const STORES: StoreAnalytics[] = [
  {
    id: "lichtval",
    name: "Lichtval",
    posthogProjectId: "162315",
    meta: {
      adAccountId: "",
      // docs/beslissingen/lichtval.md: 1 lamp €129 → max. ≈ €53 advertentiekosten per verkoop.
      breakEvenCpa: 53,
      expectedOrderValue: 134,
    },
  },
  // new-store:insert (niet weghalen: hier voegt `pnpm new-store` winkels toe)
]

function argValue(name: string) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

/** De winkel uit `--store <id>` of STORE_ID; null als er geen gekozen is. */
export function currentStore(): StoreAnalytics | null {
  const id = (argValue("store") || process.env.STORE_ID || "").toLowerCase()
  if (!id) return null
  const store = STORES.find((s) => s.id === id)
  if (!store) {
    throw new Error(`Onbekende winkel "${id}". Kies uit: ${STORES.map((s) => s.id).join(", ")} (analytics/src/stores.ts)`)
  }
  // Alleen voor de tests (test/ads-mock.test.ts): nep-advertentieaccount.
  if (process.env.ADS_TEST_AD_ACCOUNT && store.meta) {
    return { ...store, meta: { ...store.meta, adAccountId: process.env.ADS_TEST_AD_ACCOUNT } }
  }
  return store
}

/** Winkels die klaar zijn voor de automatisering (met PostHog-project). */
export const activeStores = () => STORES.filter((s) => s.posthogProjectId)
