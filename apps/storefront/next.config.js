const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/** PostHog via eigen domein (/ingest) → minder last van adblockers. */
const POSTHOG_INGEST = process.env.POSTHOG_API_HOST || "https://eu.i.posthog.com"
const POSTHOG_ASSETS =
  process.env.POSTHOG_ASSETS_HOST || "https://eu-assets.i.posthog.com"

/** Publieke backend-URL (productfoto's staan op <backend>/static). */
const PUBLIC_BACKEND = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "")
  } catch {
    return null
  }
})()

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Link", value: '</.well-known/ucp>; rel="ucp"' }],
      },
      {
        source: "/:countryCode/products/:handle",
        headers: [{ key: "Vary", value: "Accept" }],
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:countryCode/products/:handle([^/.]+).md",
          destination: "/:countryCode/products/:handle/markdown",
        },
        {
          source: "/:countryCode/products/:handle([^/.]+)",
          has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
          destination: "/:countryCode/products/:handle/markdown",
        },
      ],
      afterFiles: [
        { source: "/ingest/static/:path*", destination: `${POSTHOG_ASSETS}/static/:path*` },
        { source: "/ingest/array/:path*", destination: `${POSTHOG_ASSETS}/array/:path*` },
        { source: "/ingest/:path*", destination: `${POSTHOG_INGEST}/:path*` },
      ],
    }
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
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
