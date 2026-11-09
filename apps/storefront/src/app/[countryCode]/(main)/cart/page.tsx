import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { TrackEvent } from "@modules/analytics/track"
import { EVENTS } from "@lib/analytics/constants"

export const metadata: Metadata = {
  title: "Winkelwagen",
  description: "Bekijk je winkelwagen",
}

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  return (
    <>
      <TrackEvent
        event={EVENTS.cartViewed}
        properties={{
          value: cart?.total,
          currency: cart?.currency_code,
          item_count: cart?.items?.length ?? 0,
        }}
      />
      <CartTemplate cart={cart} customer={customer} />
    </>
  )
}
