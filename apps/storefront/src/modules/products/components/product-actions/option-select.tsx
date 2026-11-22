import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  /** Varianten van het product: hun variant_rank bepaalt de volgorde van de waarden. */
  variants?: HttpTypes.StoreProductVariant[]
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  name: string
  disabled: boolean
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
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

export default OptionSelect
