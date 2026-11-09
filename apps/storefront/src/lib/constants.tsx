import React from "react"
import { CreditCard } from "@medusajs/icons"

import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"
import PayPal from "@modules/common/icons/paypal"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_medusa-payments_default": {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  pp_system_default: {
    title: "Testbetaling (handmatig)",
    icon: <CreditCard />,
  },
  // Mollie (@variablevic/mollie-payments-medusa)
  "pp_mollie-ideal_mollie": { title: "iDEAL", icon: <Ideal /> },
  "pp_mollie-bancontact_mollie": { title: "Bancontact", icon: <Bancontact /> },
  "pp_mollie-card_mollie": { title: "Creditcard", icon: <CreditCard /> },
  "pp_mollie-paypal_mollie": { title: "PayPal", icon: <PayPal /> },
  "pp_mollie-apple-pay_mollie": { title: "Apple Pay", icon: <CreditCard /> },
  "pp_mollie-giftcard_mollie": { title: "Cadeaukaart", icon: <CreditCard /> },
  "pp_mollie-hosted-checkout_mollie": {
    title: "Alle betaalmethodes (Mollie)",
    icon: <CreditCard />,
  },
  // Add more payment providers here
}

// This only checks if it is native stripe or medusa payments for card payments, it ignores the other stripe-based providers
export const isStripeLike = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_stripe_") || providerId?.startsWith("pp_medusa-")
  )
}

export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isMollie = (providerId?: string) => {
  return providerId?.startsWith("pp_mollie")
}

export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
