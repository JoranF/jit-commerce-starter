import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import { PostHogProvider } from "@modules/analytics/posthog-provider"
import { MotionProvider } from "@modules/common/components/motion"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="nl" data-mode="light">
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      <body>
        <PostHogProvider>
          <MotionProvider>
            <main className="relative">{props.children}</main>
          </MotionProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
