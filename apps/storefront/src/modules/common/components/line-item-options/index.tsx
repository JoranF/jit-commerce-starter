import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

type LineItemOptionsProps = {
  variant: HttpTypes.StoreProductVariant | undefined
  "data-testid"?: string
  "data-value"?: HttpTypes.StoreProductVariant
}

const LineItemOptions = ({
  variant,
  "data-testid": dataTestid,
  "data-value": dataValue,
}: LineItemOptionsProps) => {
  // Product met één uitvoering: "Uitvoering: Standaard" zegt niets, dus weglaten.
  const title = variant?.title?.trim()
  if (!title || /^(standaard|default( variant| title)?)$/i.test(title)) {
    return null
  }

  return (
    <Text
      data-testid={dataTestid}
      data-value={dataValue}
      className="inline-block txt-medium text-ui-fg-subtle w-full overflow-hidden text-ellipsis"
    >
      {title}
    </Text>
  )
}

export default LineItemOptions
