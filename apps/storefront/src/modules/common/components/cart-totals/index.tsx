"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_total?: number | null
    item_subtotal?: number | null
    shipping_total?: number | null
    shipping_subtotal?: number | null
    discount_total?: number | null
    discount_subtotal?: number | null
    shipping_methods?: unknown[] | null
  }
}

/**
 * Totalen voor consumenten in NL/BE: bedragen inclusief btw, met daaronder
 * "Inclusief € x btw". (Medusa's *_subtotal-velden zijn exclusief btw.)
 */
const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const { currency_code, total, tax_total } = totals
  const items = totals.item_total ?? totals.item_subtotal ?? 0
  const shipping = totals.shipping_total ?? totals.shipping_subtotal ?? 0
  // Winkelmand zonder gekozen verzendmethode: nog geen bedrag tonen (geen € 0,00).
  const shippingUnknown = Array.isArray(totals.shipping_methods) && totals.shipping_methods.length === 0
  const discount = totals.discount_total ?? totals.discount_subtotal ?? 0
  const money = (amount: number | null | undefined) =>
    convertToLocale({ amount: amount ?? 0, currency_code })

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Subtotaal</span>
          <span data-testid="cart-subtotal" data-value={items}>
            {money(items)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Verzending</span>
          <span data-testid="cart-shipping" data-value={shipping}>
            {shippingUnknown ? "Bij het afrekenen" : money(shipping)}
          </span>
        </div>
        {!!discount && (
          <div className="flex items-center justify-between">
            <span>Korting</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount}
            >
              - {money(discount)}
            </span>
          </div>
        )}
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base txt-medium ">
        <span>Totaal</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {money(total)}
        </span>
      </div>
      <p className="mb-2 mt-1 text-right txt-small text-ui-fg-subtle" data-testid="cart-taxes" data-value={tax_total || 0}>
        {tax_total ? `Inclusief ${money(tax_total)} btw` : "Inclusief btw"}
      </p>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
