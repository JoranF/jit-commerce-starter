/**
 * Minimale PostHog REST-client (geen dependencies, Node 20+ fetch).
 *
 * Benodigd:
 *   POSTHOG_PERSONAL_API_KEY  phx_... (Settings > Personal API keys) met scopes:
 *                             query:read, insight:write, dashboard:write,
 *                             experiment:write, feature_flag:write
 *   POSTHOG_PROJECT_ID        project-ID (zie URL: /project/<id>)
 *   POSTHOG_APP_HOST          https://eu.posthog.com (EU cloud) of je eigen instance
 */

export type PostHogEnv = {
  apiKey: string
  projectId: string
  host: string
}

export function envFromProcess(): PostHogEnv {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID
  const host = (process.env.POSTHOG_APP_HOST || "https://eu.posthog.com").replace(/\/$/, "")
  if (!apiKey || !projectId) {
    throw new Error(
      "POSTHOG_PERSONAL_API_KEY en POSTHOG_PROJECT_ID zijn verplicht (zie analytics/.env.example)."
    )
  }
  return { apiKey, projectId, host }
}

export class PostHogApi {
  constructor(private env: PostHogEnv) {}

  private url(path: string) {
    return `${this.env.host}/api/projects/${this.env.projectId}${path}`
  }

  async request<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(this.url(path), {
      method,
      headers: {
        Authorization: `Bearer ${this.env.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    if (!res.ok) {
      throw new Error(`PostHog ${method} ${path} → ${res.status}: ${text.slice(0, 500)}`)
    }
    return (text ? JSON.parse(text) : {}) as T
  }

  /** HogQL (SQL) query → rijen als objecten. */
  async hogql<T extends Record<string, unknown> = Record<string, unknown>>(
    query: string,
    name?: string
  ): Promise<T[]> {
    const res = await this.request<{ columns: string[]; results: unknown[][] }>(
      "POST",
      "/query/",
      { query: { kind: "HogQLQuery", query }, name }
    )
    return (res.results ?? []).map(
      (row) => Object.fromEntries(res.columns.map((c, i) => [c, row[i]])) as T
    )
  }

  async listAll<T = any>(path: string): Promise<T[]> {
    const out: T[] = []
    let next: string | null = path.includes("?") ? `${path}&limit=200` : `${path}?limit=200`
    while (next) {
      const page: { results: T[]; next: string | null } = await this.request("GET", next)
      out.push(...page.results)
      next = page.next ? page.next.replace(/^.*\/api\/projects\/[^/]+/, "") : null
    }
    return out
  }
}

/** Escape een string voor gebruik in een HogQL string-literal. */
export function sqlString(value: string) {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`
}
