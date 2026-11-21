import { HttpTypes } from "@medusajs/types"

export const CHECKOUT_STEPS = ["address", "delivery", "payment", "review"] as const
export type CheckoutStep = (typeof CHECKOUT_STEPS)[number]

/** De eerste checkout-stap die de klant nog moet doen. */
export function getCheckoutStep(cart: HttpTypes.StoreCart): CheckoutStep {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  }
  if (!cart.shipping_methods?.length) {
    return "delivery"
  }
  return "payment"
}
