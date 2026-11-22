/**
 * Advertentie-attributie: met welke advertentie kwam deze bezoeker binnen?
 *
 * Zet in Meta (advertentie → URL-parameters) bijvoorbeeld:
 *   utm_source=meta&utm_medium=paid&utm_campaign={{campaign.id}}&utm_term={{adset.id}}&utm_content={{ad.id}}&angle=cadeau
 *
 * De middleware bewaart de laatste advertentieklik 30 dagen in de cookie `jit_ad`
 * (laatste klik telt, zoals Meta ook rekent). Daarna gaat hij mee:
 * - als PostHog super properties (`ad_*`) op elk event → funnel per advertentie
 * - in cart.metadata → `order_completed` (server-side) → omzet per advertentie
 * - `angle` kiest de landingspagina-variant (store.angles)
 *
 * Bewust zonder externe imports: draait ook in de edge-middleware.
 */
export const AD_COOKIE = "jit_ad"
export const AD_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export type AdTouch = {
  source?: string
  medium?: string
  campaign?: string
  adset?: string
  ad?: string
  angle?: string
  fbclid?: string
  /** Eerste pagina van dit bezoek (pad, zonder query). */
  landing?: string
  /** ISO-tijdstip van de klik. */
  at?: string
}

const PARAMS: Record<string, keyof AdTouch> = {
  utm_source: "source",
  utm_medium: "medium",
  utm_campaign: "campaign",
  utm_term: "adset",
  utm_content: "ad",
  angle: "angle",
  fbclid: "fbclid",
}

const clean = (v: string | null) => {
  const s = v?.trim().slice(0, 120)
  return s ? s : undefined
}

/** Advertentiegegevens uit de query string; null als er geen advertentieparameters zijn. */
export function adTouchFromUrl(url: URL): AdTouch | null {
  const touch: AdTouch = {}
  for (const [param, key] of Object.entries(PARAMS)) {
    const v = clean(url.searchParams.get(param))
    if (v) touch[key] = v
  }
  if (!Object.keys(touch).length) return null
  // Klik van Meta zonder utm's: dan weten we in elk geval de bron.
  if (touch.fbclid && !touch.source) touch.source = "meta"
  touch.landing = url.pathname
  touch.at = new Date().toISOString()
  return touch
}

export function encodeAdTouch(touch: AdTouch): string {
  return encodeURIComponent(JSON.stringify(touch))
}

/**
 * Leest de cookie-waarde, of die nu al gedecodeerd is (Next `cookies()`), één
 * keer ge-URL-encoded (document.cookie) of in een zelfgebouwde cookie-header.
 */
export function decodeAdTouch(value: string | undefined | null): AdTouch | null {
  let v = value
  for (let i = 0; v && i < 3; i++) {
    try {
      const parsed = JSON.parse(v)
      return parsed && typeof parsed === "object" ? (parsed as AdTouch) : null
    } catch {
      try {
        v = decodeURIComponent(v)
      } catch {
        return null
      }
    }
  }
  return null
}

/**
 * Plat als `ad_source`, `ad_campaign`, … voor PostHog en cart.metadata.
 * fbclid gaat niet mee naar PostHog (niet nodig, wel een klik-ID van Meta).
 */
export function adProperties(touch: AdTouch | null): Record<string, string> {
  if (!touch) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(touch)) {
    if (k === "fbclid" || !v) continue
    out[`ad_${k}`] = String(v)
  }
  return out
}
