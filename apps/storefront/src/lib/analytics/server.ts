import "server-only"

import { cookies, headers } from "next/headers"
import { PostHog } from "posthog-node"
import { VISITOR_COOKIE, VISITOR_HEADER, type ExperimentKey } from "./constants"

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.POSTHOG_API_HOST || "https://eu.i.posthog.com"

let client: PostHog | null = null

function getClient() {
  if (!POSTHOG_KEY) return null
  if (!client) {
    client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return client
}

/** Stabiele bezoekers-ID: dezelfde ID die posthog-js in de browser gebruikt. */
export async function getVisitorId(): Promise<string | undefined> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(VISITOR_COOKIE)?.value
  if (fromCookie) return fromCookie
  const headerStore = await headers()
  return headerStore.get(VISITOR_HEADER) ?? undefined
}

/**
 * Server-side variant van een experiment (geen flikkering).
 * Gebruik dit in server components die toch al dynamisch renderen.
 * Valt terug op "control" als PostHog niet geconfigureerd of onbereikbaar is.
 */
export async function getExperimentVariant(
  flag: ExperimentKey
): Promise<string> {
  const ph = getClient()
  const id = await getVisitorId()
  if (!ph || !id) return "control"
  try {
    const v = await ph.getFeatureFlag(flag, id)
    return typeof v === "string" ? v : v ? "test" : "control"
  } catch {
    return "control"
  }
}

/** Alle actieve flag-varianten als `$feature/<key>` properties. */
export async function getFeatureProperties(
  distinctId: string
): Promise<Record<string, string | boolean>> {
  const ph = getClient()
  if (!ph) return {}
  try {
    const flags = await ph.getAllFlags(distinctId)
    return Object.fromEntries(
      Object.entries(flags).map(([k, v]) => [`$feature/${k}`, v])
    )
  } catch {
    return {}
  }
}
