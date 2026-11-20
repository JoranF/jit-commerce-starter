import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

/** Medusa-statussen in gewone taal. */
const STATUS_NL: Record<string, string> = {
  not_fulfilled: "Wordt verwerkt",
  partially_fulfilled: "Deels klaar voor verzending",
  fulfilled: "Klaar voor verzending",
  partially_shipped: "Deels verzonden",
  shipped: "Verzonden",
  partially_delivered: "Deels bezorgd",
  delivered: "Bezorgd",
  canceled: "Geannuleerd",
  not_paid: "Niet betaald",
  awaiting: "Wacht op betaling",
  authorized: "Betaald",
  partially_authorized: "Deels betaald",
  captured: "Betaald",
  partially_captured: "Deels betaald",
  refunded: "Terugbetaald",
  partially_refunded: "Deels terugbetaald",
  requires_action: "Actie nodig",
}

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string) => {
    if (STATUS_NL[str]) {
      return STATUS_NL[str]
    }
    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div>
      <Text>
        Besteld met{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>
      <Text className="mt-2">
        Besteld op:{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </Text>
      <Text className="mt-2 text-ui-fg-interactive">
        Bestelnummer: <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text>
              Status:{" "}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {formatStatus(order.fulfillment_status)}
              </span>
            </Text>
            <Text>
              Betaling:{" "}
              <span
                className="text-ui-fg-subtle "
                sata-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
