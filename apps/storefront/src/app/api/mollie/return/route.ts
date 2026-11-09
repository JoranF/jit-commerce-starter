import { sdk } from "@lib/config"
import { NextRequest, NextResponse } from "next/server"

const CART_COOKIE = "_medusa_cart_id"
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "nl"

/**
 * Hier komt de klant terug na betalen bij Mollie (MOLLIE_REDIRECT_URL).
 *
 * 1. Cart afronden → Medusa vraagt Mollie of de betaling gelukt is.
 * 2. Gelukt → naar de bedankpagina.
 * 3. Geannuleerd/mislukt → terug naar de betaalstap met een melding.
 *
 * De Mollie-webhook rondt de bestelling ook af (bv. als de klant het tabblad
 * sluit). Komt die eerder binnen, dan geeft "complete" de bestaande order terug.
 */
export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin
  const cartId = req.cookies.get(CART_COOKIE)?.value

  if (!cartId) {
    return NextResponse.redirect(`${origin}/${DEFAULT_REGION}`)
  }

  let countryCode = DEFAULT_REGION
  try {
    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: "id,shipping_address.country_code",
    })
    countryCode =
      cart.shipping_address?.country_code?.toLowerCase() || DEFAULT_REGION
  } catch {
    // cart kan al afgerond zijn; dan proberen we gewoon te completen
  }

  try {
    const res = await sdk.store.cart.complete(cartId)

    if (res.type === "order") {
      const response = NextResponse.redirect(
        `${origin}/${countryCode}/order/${res.order.id}/confirmed`
      )
      response.cookies.set(CART_COOKIE, "", { maxAge: -1, path: "/" })
      return response
    }

    // type === "cart": betaling (nog) niet gelukt
    return NextResponse.redirect(
      `${origin}/${countryCode}/checkout?step=payment&payment_status=failed`
    )
  } catch (e) {
    console.warn("[mollie] afronden na redirect mislukt:", (e as Error).message)
    return NextResponse.redirect(
      `${origin}/${countryCode}/checkout?step=payment&payment_status=failed`
    )
  }
}
