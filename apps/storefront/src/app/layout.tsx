import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import "styles/globals.css"
import "../stores/fonts"
import { store, themeCss } from "@stores"
import { PostHogProvider } from "@modules/analytics/posthog-provider"
import { MotionProvider } from "@modules/common/components/motion"
import { ConsentBanner } from "@modules/analytics/consent-banner"
import { MetaPixel } from "@modules/analytics/meta-pixel"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: { default: store.seo.title, template: `%s | ${store.name}` },
  description: store.seo.description,
  applicationName: store.name,
  openGraph: { siteName: store.name, locale: "nl_NL", type: "website" },
}

export const viewport: Viewport = {
  themeColor: store.theme.colors.dark,
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="nl" data-mode="light" data-scroll-behavior="smooth">
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      <body className="antialiased">
        <PostHogProvider>
          <MotionProvider>
            <main className="relative">{props.children}</main>
          </MotionProvider>
          <ConsentBanner />
          <MetaPixel />
        </PostHogProvider>
      </body>
    </html>
  )
}
