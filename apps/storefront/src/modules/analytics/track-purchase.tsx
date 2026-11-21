"use client"

import { useEffect, useRef } from "react"
import { pixelTrack } from "./meta-pixel"

/**
 * Purchase naar de Meta Pixel op de bedankpagina. Zelfde event_id als de
 * Conversions API in de backend (`order_<id>`), zodat Meta het maar één keer telt.
 */
export function TrackPurchase(props: {
  orderId: string
  value: number
  currency: string
  items: { id: string; quantity: number }[]
}) {
  const sent = useRef(false)
  useEffect(() => {
    if (sent.current) return
    const t = setTimeout(() => {
      pixelTrack(
        "Purchase",
        {
          value: props.value,
          currency: props.currency.toUpperCase(),
          content_type: "product",
          content_ids: props.items.map((i) => i.id),
          contents: props.items,
          num_items: props.items.reduce((n, i) => n + i.quantity, 0),
        },
        `order_${props.orderId}`
      )
      sent.current = true
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.orderId])
  return null
}
