import { sdk } from "@lib/config"
import { activateCart } from "@lib/util/server-cart"
import { getRequestOrigin } from "@lib/util/site"
import { NextResponse } from "next/server"

const NO_STORE = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" }

/**
 * Link uit de herinneringsmail (backend job `cart-reminder`): zet de bewaarde winkelmand
 * terug in deze browser en gaat naar de checkout. Is de winkelmand al afgerekend of weg,
 * dan gewoon naar de winkel.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ countryCode: string; id: string }> }
) {
  const { countryCode, id } = await params
  const origin = getRequestOrigin(request)
  const cc = /^[a-z]{2}$/i.test(countryCode) ? countryCode.toLowerCase() : "nl"
  if (/^cart_[A-Za-z0-9]+$/.test(id)) {
    try {
      const { cart } = await sdk.store.cart.retrieve(id, { fields: "id,completed_at,*items" })
      if (cart && !cart.completed_at && cart.items?.length) {
        await activateCart(cart.id)
        return NextResponse.redirect(`${origin}/${cc}/checkout`, { status: 303, headers: NO_STORE })
      }
    } catch {
      // Onbekend of verlopen: naar de winkel.
    }
  }
  return NextResponse.redirect(`${origin}/${cc}`, { status: 303, headers: NO_STORE })
}
