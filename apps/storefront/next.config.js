const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/** Publieke backend-URL (productfoto's staan op <backend>/static). */
const PUBLIC_BACKEND = (() => {
  try {
    return new URL(process.env.MEDUSA_PUBLIC_BACKEND_URL || "")
  } catch {
    return null
  }
})()

/**
 * @type {import('next').NextConfig}
 */
const POSTHOG_INGEST = process.env.POSTHOG_API_HOST || "https://eu.i.posthog.com"
const POSTHOG_ASSETS =
  process.env.POSTHOG_ASSETS_HOST || "https://eu-assets.i.posthog.com"

const nextConfig = {
  reactStrictMode: true,
  // PostHog via eigen domein (/ingest) → minder last van adblockers.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `${POSTHOG_ASSETS}/static/:path*` },
      { source: "/ingest/array/:path*", destination: `${POSTHOG_ASSETS}/array/:path*` },
      { source: "/ingest/:path*", destination: `${POSTHOG_INGEST}/:path*` },
    ]
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      ...(PUBLIC_BACKEND
        ? [
            {
              protocol: PUBLIC_BACKEND.protocol.replace(":", ""),
              hostname: PUBLIC_BACKEND.hostname,
            },
          ]
        : []),
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
