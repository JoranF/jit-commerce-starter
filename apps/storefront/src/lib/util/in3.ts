import type { HttpTypes } from "@medusajs/types"

/** in3 (Mollie, in 3 termijnen) wil naam, adres, e-mail en telefoon van de koper. */
export const isIn3 = (providerId?: string) => providerId === "pp_mollie-in3_mollie"

export function in3Billing(cart: HttpTypes.StoreCart) {
  const a = cart.billing_address ?? cart.shipping_address
  return {
    first_name: a?.first_name,
    last_name: a?.last_name,
    email: cart.email,
    phone: a?.phone || cart.shipping_address?.phone,
    address_1: [a?.address_1, a?.address_2].filter(Boolean).join(" "),
    postal_code: a?.postal_code,
    city: a?.city,
    country_code: a?.country_code,
  }
}
