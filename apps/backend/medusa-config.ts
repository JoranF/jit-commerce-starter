import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const REDIS_URL = process.env.REDIS_URL
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY
const POSTHOG_EVENTS_KEY = process.env.POSTHOG_EVENTS_KEY

/**
 * Productie (Dokploy): zet REDIS_URL, dan gebruiken event bus, workflows
 * en locking Redis. Lokaal zonder Redis valt alles terug op in-memory.
 */
const redisModules = REDIS_URL
  ? [
      {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: { redisUrl: REDIS_URL },
      },
      {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: { redis: { url: REDIS_URL } },
      },
      {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl: REDIS_URL },
            },
          ],
        },
      },
    ]
  : []

/**
 * Betalingen: Mollie (iDEAL, Bancontact, creditcard, PayPal, Apple Pay).
 * Zonder MOLLIE_API_KEY is alleen de handmatige testbetaling beschikbaar.
 */
const paymentModule = MOLLIE_API_KEY
  ? [
      {
        resolve: "@medusajs/medusa/payment",
        options: {
          providers: [
            {
              resolve: "@variablevic/mollie-payments-medusa/providers/mollie",
              id: "mollie",
              options: {
                apiKey: MOLLIE_API_KEY,
                redirectUrl: process.env.MOLLIE_REDIRECT_URL,
                medusaUrl: process.env.MEDUSA_BACKEND_URL,
                autoCapture: true,
                description: process.env.MOLLIE_DESCRIPTION || "Bestelling",
              },
            },
          ],
        },
      },
    ]
  : []

/**
 * Server-side analytics: Medusa's eigen Analytics Module met de PostHog-provider.
 * Events zoals order_placed worden vanuit de backend gestuurd (betrouwbaar,
 * geen adblockers). Zonder key wordt de lokale provider gebruikt (logt alleen).
 */
const analyticsModule = {
  resolve: "@medusajs/medusa/analytics",
  options: {
    providers: [
      POSTHOG_EVENTS_KEY
        ? {
            resolve: "@medusajs/medusa/analytics-posthog",
            id: "posthog",
            options: {
              posthogEventsKey: POSTHOG_EVENTS_KEY,
              posthogHost: process.env.POSTHOG_HOST || "https://eu.i.posthog.com",
            },
          }
        : {
            resolve: "@medusajs/medusa/analytics-local",
            id: "local",
          },
    ],
  },
}

/**
 * Bestanden (productfoto's): lokaal op schijf in /app/static (Docker-volume),
 * publiek bereikbaar via <MEDUSA_BACKEND_URL>/static. Wil je S3/R2/MinIO?
 * Vervang dit door @medusajs/medusa/file-s3.
 */
const fileModule = {
  resolve: "@medusajs/medusa/file",
  options: {
    providers: [
      {
        resolve: "@medusajs/medusa/file-local",
        id: "local",
        options: {
          upload_dir: "static",
          backend_url: `${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/static`,
        },
      },
    ],
  },
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: REDIS_URL,
    workerMode: (process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server") || "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [...redisModules, ...paymentModule, analyticsModule, fileModule],
})
