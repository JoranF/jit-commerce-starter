import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import { store } from "@stores"
import React from "react"

/** Extra regels onder een optie, bv. prijs, prijs per stuk en besparing (store.buy.packs). */
export type OptionDetail = { price?: string; sub?: string; badge?: string }

// Winkel met één product: keuzes in de merkstijl; catalogus: Medusa's standaard.
const brand = !store.catalog

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  /** Varianten van het product: hun variant_rank bepaalt de volgorde van de waarden. */
  variants?: HttpTypes.StoreProductVariant[]
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  name: string
  disabled: boolean
  /** Per optiewaarde: prijs/besparing (alleen getoond als aanwezig). */
  details?: Record<string, OptionDetail>
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  variants,
  current,
  updateOption,
  title,
  name,
  "data-testid": dataTestId,
  disabled,
  details,
}) => {
  // Volgorde: rank van de waarde, dan de laagste variant_rank met die waarde
  // (zodat "250 g" vóór "1 kg" staat), dan alfabetisch.
  const variantRank = (value: string) =>
    Math.min(
      ...(variants ?? [])
        .filter((v) => v.options?.some((o) => o.option_id === option.id && o.value === value))
        .map((v) => (v as { variant_rank?: number }).variant_rank ?? 0),
      Infinity
    )
  const filteredOptions = [...(option.values ?? [])]
    .sort(
      (a, b) =>
        (a.rank ?? 0) - (b.rank ?? 0) ||
        variantRank(a.value) - variantRank(b.value) ||
        a.value.localeCompare(b.value, "nl")
    )
    .map((v) => v.value)

  return (
    <fieldset className="flex flex-col gap-y-3" disabled={disabled}>
      <legend className="text-sm mb-3">{title}</legend>
      <div
        className="flex flex-wrap justify-between gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const id = `${name}-${v}`.replace(/[^A-Za-z0-9_-]/g, "-")
          return (
            <div key={v} className="flex-1">
              <input
                type="radio"
                id={id}
                name={name}
                value={v}
                checked={v === current}
                onChange={() => updateOption(option.id, v)}
                className="peer sr-only"
              />
              {details?.[v] ? (
                <label
                  htmlFor={id}
                  className={clx(
                    "relative flex h-full cursor-pointer flex-col items-start gap-0.5 rounded-[4px] border px-4 py-3 text-left transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed",
                    brand
                      ? v === current
                        ? "border-brand-ink bg-white ring-1 ring-brand-ink peer-focus-visible:ring-brand-ink"
                        : "border-brand-ink/20 bg-white/60 hover:border-brand-ink/50"
                      : v === current
                        ? "border-ui-border-interactive bg-ui-bg-base"
                        : "border-ui-border-base bg-ui-bg-subtle"
                  )}
                  data-testid="option-button"
                >
                  <span className="text-base font-medium">{v}</span>
                  {details[v].price && <span className="text-base">{details[v].price}</span>}
                  {details[v].sub && (
                    <span className="text-sm text-brand-ink/65">{details[v].sub}</span>
                  )}
                  {details[v].badge && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-brand-accent px-2 py-0.5 text-xs font-medium text-brand-ink">
                      {details[v].badge}
                    </span>
                  )}
                </label>
              ) : (
                <label
                  htmlFor={id}
                  className={clx(
                    "flex items-center justify-center cursor-pointer border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded p-2 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-disabled:cursor-not-allowed",
                    {
                      "border-ui-border-interactive": v === current,
                      "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                        v !== current,
                    }
                  )}
                  data-testid="option-button"
                >
                  {v}
                </label>
              )}
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

export default OptionSelect
