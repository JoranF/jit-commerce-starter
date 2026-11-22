/**
 * Minimale Meta Marketing API-client (Graph API, geen dependencies).
 *
 * Benodigd: META_ADS_TOKEN, een System User-token (Business Manager → Instellingen →
 * Systeemgebruikers) met `ads_read` + `ads_management` op het advertentieaccount.
 * META_GRAPH_HOST alleen voor tests (standaard https://graph.facebook.com).
 */
import type { AdsetInfo } from "./ads-rules"

export type MetaInsight = {
  adId: string
  adName: string
  adsetId: string
  adsetName: string
  campaignName: string
  spend: number
  purchases: number
}

const n = (v: unknown) => Number(v ?? 0) || 0

export class MetaAds {
  private host: string
  private version: string

  constructor(private token: string) {
    this.host = (process.env.META_GRAPH_HOST || "https://graph.facebook.com").replace(/\/$/, "")
    this.version = process.env.META_GRAPH_VERSION || "v24.0"
  }

  static fromEnv() {
    const token = process.env.META_ADS_TOKEN
    if (!token) throw new Error("META_ADS_TOKEN ontbreekt (System User-token met ads_read + ads_management).")
    return new MetaAds(token)
  }

  private async call<T>(method: "GET" | "POST", path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(path.startsWith("http") ? path : `${this.host}/${this.version}/${path}`)
    const body = new URLSearchParams({ ...params, access_token: this.token })
    if (method === "GET") body.forEach((v, k) => url.searchParams.set(k, v))
    const res = await fetch(url, method === "POST" ? { method, body } : { method })
    const data = (await res.json().catch(() => ({}))) as any
    if (!res.ok || data.error) {
      throw new Error(`Meta ${method} ${path}: ${res.status} ${JSON.stringify(data.error ?? data).slice(0, 300)}`)
    }
    return data as T
  }

  private async all<T>(path: string, params: Record<string, string>): Promise<T[]> {
    const out: T[] = []
    let page = await this.call<{ data: T[]; paging?: { next?: string } }>("GET", path, { limit: "200", ...params })
    out.push(...page.data)
    while (page.paging?.next) {
      page = await this.call("GET", page.paging.next)
      out.push(...page.data)
    }
    return out
  }

  /** Uitgaven en aankopen (volgens Meta) per advertentie over de laatste `days` dagen. */
  async adInsights(account: string, days: number): Promise<MetaInsight[]> {
    const until = new Date()
    const since = new Date(until.getTime() - days * 86_400_000)
    const day = (d: Date) => d.toISOString().slice(0, 10)
    const rows = await this.all<any>(`${account}/insights`, {
      level: "ad",
      fields: "ad_id,ad_name,adset_id,adset_name,campaign_name,spend,actions",
      time_range: JSON.stringify({ since: day(since), until: day(until) }),
    })
    return rows.map((r) => ({
      adId: String(r.ad_id),
      adName: String(r.ad_name ?? ""),
      adsetId: String(r.adset_id),
      adsetName: String(r.adset_name ?? ""),
      campaignName: String(r.campaign_name ?? ""),
      spend: n(r.spend),
      purchases: n(
        (r.actions ?? []).find((a: any) =>
          ["purchase", "offsite_conversion.fb_pixel_purchase", "omni_purchase"].includes(a.action_type)
        )?.value
      ),
    }))
  }

  /** Status van alle advertenties (ACTIVE, PAUSED, …) op id. */
  async adStatuses(account: string): Promise<Map<string, string>> {
    const ads = await this.all<any>(`${account}/ads`, { fields: "id,effective_status" })
    return new Map(ads.map((a) => [String(a.id), String(a.effective_status)]))
  }

  async adsets(ids: string[]): Promise<AdsetInfo[]> {
    const out: AdsetInfo[] = []
    for (const id of ids) {
      const s = await this.call<any>("GET", id, { fields: "id,name,daily_budget,updated_time" })
      out.push({
        id: String(s.id),
        name: String(s.name ?? ""),
        // Meta: bedragen in centen van de accountvaluta.
        dailyBudget: s.daily_budget ? n(s.daily_budget) / 100 : null,
        updatedTime: s.updated_time,
      })
    }
    return out
  }

  pauseAd(adId: string) {
    return this.call("POST", adId, { status: "PAUSED" })
  }

  setDailyBudget(adsetId: string, eur: number) {
    return this.call("POST", adsetId, { daily_budget: String(Math.round(eur * 100)) })
  }
}
