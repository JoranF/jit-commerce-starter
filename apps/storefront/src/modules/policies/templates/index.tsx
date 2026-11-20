import { convertToLocale } from "@lib/util/money"
import { formatDayRange, StorePolicies } from "@lib/util/store-policies"
import { store } from "@stores"

export const formatShippingRate = (rate: number, currencyCode: string) =>
  rate === 0 ? "Gratis" : convertToLocale({ amount: rate, currency_code: currencyCode })

const range = (r: { min: number; max: number }) => formatDayRange(r).replace("-", "–")

export const PolicyPage = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="bg-brand-light text-brand-ink">
    <div className="content-container max-w-3xl py-16 small:py-24" data-testid="policy-page">
      <h1 className="mb-10 font-display text-[clamp(2.3rem,4.5vw,3.4rem)] leading-[1.04] tracking-[-0.01em]">
        {title}
      </h1>
      <div className="flex flex-col gap-5 text-base leading-relaxed text-brand-ink/85 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-brand-ink [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </div>
  </div>
)

export const PoliciesUnavailable = () => (
  <p className="text-brand-muted">
    De voorwaarden voor deze regio staan nog niet online. Neem contact met ons op als je vragen hebt.
  </p>
)

export const ShippingSummary = ({
  policies,
  currencyCode,
}: {
  policies: StorePolicies
  currencyCode: string
}) => (
  <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 border-y border-brand-ink/10 py-4">
    <dt className="text-brand-muted">Verzendkosten</dt>
    <dd>{formatShippingRate(policies.shippingRate, currencyCode)}</dd>
    <dt className="text-brand-muted">Verwerking</dt>
    <dd>{range(policies.handlingDays)} werkdagen</dd>
    <dt className="text-brand-muted">Bezorging</dt>
    <dd>{range(policies.transitDays)} werkdagen na verzending</dd>
  </dl>
)

/** Zolang de bedrijfsgegevens ontbreken, is de winkel niet klaar voor livegang. */
export const companyComplete = () =>
  !!(store.company.legalName && store.company.email && store.company.address && store.company.kvk)

export const PlaceholderNotice = () =>
  companyComplete() ? null : (
    <p
      className="rounded-[2px] border border-brand-ink/20 bg-brand-accent/25 p-4 text-sm"
      data-testid="policy-placeholder"
    >
      Conceptversie: de bedrijfsgegevens (KvK, adres, e-mail) ontbreken nog. Vul ze in in de
      winkelconfiguratie en laat deze tekst controleren vóór de winkel live gaat.
    </p>
  )

/** Bedrijfsgegevens als lijst; leeg = niets. */
export const CompanyDetails = () => {
  const c = store.company
  const rows = [
    ["Bedrijf", c.legalName],
    ["Adres", c.address],
    ["E-mail", c.email],
    ["Telefoon", c.phone],
    ["KvK", c.kvk],
    ["Btw", c.vat],
  ].filter(([, v]) => !!v) as [string, string][]
  if (!rows.length) {
    return null
  }
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 border-y border-brand-ink/10 py-4">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-brand-muted">{k}</dt>
          <dd>{k === "E-mail" ? <a href={`mailto:${v}`}>{v}</a> : v}</dd>
        </div>
      ))}
    </dl>
  )
}
