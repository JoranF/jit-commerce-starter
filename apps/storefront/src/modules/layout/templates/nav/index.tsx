import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"
import { store } from "@stores"

/** Navigatie voor een winkel met één product: merk, twee ankers, winkelmand. */
function BrandNav() {
  const link =
    "rounded-sm transition-colors hover:text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink"
  return (
    <div className="sticky inset-x-0 top-0 z-50">
      <header className="h-16 border-b border-brand-ink/10 bg-brand-light/95 text-brand-ink backdrop-blur supports-[backdrop-filter]:bg-brand-light/80">
        <nav
          aria-label="Hoofdmenu"
          className="content-container flex h-full items-center justify-between"
        >
          <LocalizedClientLink
            href="/"
            className={`font-display text-[1.65rem] leading-none tracking-[-0.01em] ${link}`}
            data-testid="nav-store-link"
          >
            {store.name}
          </LocalizedClientLink>
          <div className="flex items-center gap-x-7 text-base text-brand-ink/75">
            <LocalizedClientLink href="/#lamp" className={`hidden xsmall:inline ${link}`}>
              De lamp
            </LocalizedClientLink>
            <LocalizedClientLink href="/#vragen" className={`hidden xsmall:inline ${link}`}>
              Vragen
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink className={link} href="/cart" data-testid="nav-cart-link">
                  Winkelmand (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}

export default async function Nav() {
  if (!store.catalog) {
    return <BrandNav />
  }

  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:text-ui-fg-base uppercase"
              data-testid="nav-store-link"
            >
              {store.name}
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <Search />
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-ui-fg-base"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Winkelmand (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
