import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { CHECKOUT_STEPS, getCheckoutStep } from "@lib/util/checkout-step"
import CheckoutStepTracker from "@modules/analytics/checkout-step-tracker"
import PaymentStatusNotice from "@modules/checkout/components/payment-status-notice"

export const metadata: Metadata = {
  title: "Afrekenen",
}

export default async function Checkout(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ step?: string }>
}) {
  const [{ countryCode }, { step }] = await Promise.all([
    props.params,
    props.searchParams,
  ])
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  // Zonder (geldige) stap bleef de checkout eeuwig laden. Stuur door naar de
  // eerste stap die de klant nog moet doen.
  if (!step || !(CHECKOUT_STEPS as readonly string[]).includes(step)) {
    redirect(`/${countryCode}/checkout?step=${getCheckoutStep(cart)}`)
  }

  const customer = await retrieveCustomer()

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <CheckoutStepTracker
        cartId={cart.id}
        value={cart.total}
        currency={cart.currency_code}
        itemCount={cart.items?.length ?? 0}
      />
      <PaymentWrapper cart={cart}>
        <PaymentStatusNotice />
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}
