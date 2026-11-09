import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { TrackEvent } from "@modules/analytics/track"
import { EVENTS } from "@lib/analytics/constants"
import PaymentStatusNotice from "@modules/checkout/components/payment-status-notice"

export const metadata: Metadata = {
  title: "Afrekenen",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <TrackEvent
        event={EVENTS.checkoutStarted}
        properties={{
          value: cart.total,
          currency: cart.currency_code,
          item_count: cart.items?.length ?? 0,
        }}
      />
      <PaymentWrapper cart={cart}>
        <PaymentStatusNotice />
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}
