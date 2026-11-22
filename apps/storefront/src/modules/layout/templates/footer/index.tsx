import { listCategories } from "@lib/data/categories";
import { listCollections } from "@lib/data/collections";
import { Text, clx } from "@modules/common/components/ui";

import LocalizedClientLink from "@modules/common/components/localized-client-link";
import { buyAnchor, store } from "@stores";

/** Footer voor een winkel met één product. Bedrijfsgegevens uit de winkelconfig. */
function BrandFooter() {
  const { company } = store;
  // Bewust zonder adres: dat staat één klik verder op de contactpagina
  // ("Bedrijfsgegevens"), zoals de wet vraagt (rechtstreeks en permanent bereikbaar),
  // maar niet op elke pagina van de winkel.
  const details = [
    company.kvk && `KvK ${company.kvk}`,
    company.vat && `Btw ${company.vat}`,
  ].filter(Boolean) as string[];
  const link =
    "rounded-sm transition-colors hover:text-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent";
  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: "Winkel",
      links: [
        { href: `/#${buyAnchor}`, label: store.productLabel },
        { href: "/#vragen", label: "Vragen" },
      ],
    },
    {
      title: "Service",
      links: [
        { href: "/shipping", label: "Verzending" },
        { href: "/returns", label: "Retourneren" },
        { href: "/contact", label: "Contact" },
      ],
    },
    {
      title: "Voorwaarden",
      links: [
        { href: "/terms", label: "Algemene voorwaarden" },
        { href: "/privacy", label: "Privacy" },
      ],
    },
  ];

  return (
    <footer className="relative isolate overflow-hidden bg-brand-dark text-brand-light/70">
      {store.theme.texture && (
        // Merkmotief, heel zacht.
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.07] [background-size:420px]"
          style={{ backgroundImage: `url(${store.theme.texture})` }}
        />
      )}
      <div className="content-container grid gap-12 py-20 small:grid-cols-12">
        <div className="small:col-span-5">
          <LocalizedClientLink
            href="/"
            className={`font-display text-4xl leading-none text-brand-light ${link}`}
          >
            {store.name}
          </LocalizedClientLink>
          <p className="mt-4 max-w-[32ch] text-base">{store.tagline}</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 xsmall:grid-cols-3 small:col-span-7">
          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-medium text-brand-light">{col.title}</h2>
              <ul className="mt-4 flex flex-col gap-3 text-base">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <LocalizedClientLink href={l.href} className={link}>
                      {l.label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="content-container flex flex-col gap-2 border-t border-brand-light/10 py-8 text-sm xsmall:flex-row xsmall:justify-between">
        <p>
          © {new Date().getFullYear()} {company.legalName || store.name}
        </p>
        <p>
          {details.join(" · ")}
          {details.length > 0 && " · "}
          <LocalizedClientLink href="/contact" className={`underline underline-offset-4 ${link}`}>
            Bedrijfsgegevens
          </LocalizedClientLink>
        </p>
      </div>
    </footer>
  );
}

export default async function Footer() {
  if (!store.catalog) {
    return <BrandFooter />;
  }
  const [{ collections }, productCategories] = await Promise.all([
    listCollections({ fields: "id,handle,title" }),
    listCategories({
      fields:
        "id,name,handle,parent_category_id,category_children.id,category_children.name,category_children.handle",
    }),
  ]);

  return (
    <footer className="border-t border-ui-border-base w-full">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between py-40">
          <div>
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus text-ui-fg-subtle hover:text-ui-fg-base uppercase"
            >
              {store.name}
            </LocalizedClientLink>
          </div>
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">
                  Categories
                </span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category_id) {
                      return;
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null;

                    return (
                      <li
                        className="flex flex-col gap-2 text-ui-fg-subtle txt-small"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-ui-fg-base",
                            children && "txt-small-plus"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children &&
                              children.map((child) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="hover:text-ui-fg-base"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">
                  Collections
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-ui-fg-base"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base">
                Customer service
              </span>
              <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small">
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/shipping"
                  >
                    Shipping information
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/returns"
                  >
                    Return policy
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/terms"
                  >
                    Terms of service
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/privacy"
                  >
                    Privacy policy
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/contact"
                  >
                    Contact
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/search"
                  >
                    Search
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base">Medusa</span>
              <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small">
                <li>
                  <a
                    href="https://github.com/medusajs"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-ui-fg-base"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.medusajs.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-ui-fg-base"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/medusajs/dtc-starter"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-ui-fg-base"
                  >
                    Source code
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex w-full mb-16 justify-between text-ui-fg-muted">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} {store.name}
          </Text>
        </div>
      </div>
    </footer>
  );
}
