import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { TrackPurchase } from "@modules/analytics/track-purchase"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}
export const metadata: Metadata = {
  title: "Bestelling geplaatst",
  description: "Je bestelling is geplaatst.",
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  return (
    <>
      <TrackPurchase
        orderId={order.id}
        value={Number(order.total ?? 0)}
        currency={order.currency_code}
        items={(order.items ?? []).map((i) => ({
          id: i.product_id ?? i.variant_id ?? i.id,
          quantity: i.quantity,
        }))}
      />
      <OrderCompletedTemplate order={order} />
    </>
  )
}
