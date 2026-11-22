import { retrieveOrderStatus } from "@lib/data/orders"
import { getStorePolicies } from "@lib/data/store-policies"
import { addBusinessDays, shortDate } from "@lib/util/delivery-dates"
import { store } from "@stores"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Volg je bestelling",
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ id: string; countryCode: string }> }

type Fulfillment = {
  shipped_at?: string | null
  delivered_at?: string | null
  canceled_at?: string | null
  labels?: { tracking_number?: string | null; tracking_url?: string | null }[] | null
}

/**
 * "Volg je bestelling": stappen in gewone taal (besteld → klaargemaakt → onderweg →
 * bezorgd), met de verwachte bezorgdatum. De link naar de vervoerder staat er als
 * extra bij. Zo hoeft de klant geen onduidelijke statussen van een vervoerder te
 * lezen om te weten waar hij aan toe is. Link staat in de mails.
 */
export default async function OrderStatusPage(props: Props) {
  const { id, countryCode } = await props.params
  const [order, { current: policies }] = await Promise.all([
    retrieveOrderStatus(id),
    getStorePolicies(countryCode),
  ])
  if (!order) notFound()

  const fulfillments = ((order as unknown as { fulfillments?: Fulfillment[] }).fulfillments ?? []).filter(
    (f) => !f.canceled_at
  )
  const shippedAt = fulfillments.map((f) => f.shipped_at).find(Boolean)
  const deliveredAt = fulfillments.map((f) => f.delivered_at).find(Boolean)
  const fs = String((order as { fulfillment_status?: string }).fulfillment_status ?? "")
  const canceled = order.status === "canceled"
  const delivered = !!deliveredAt || fs.includes("delivered")
  const shipped = delivered || !!shippedAt || fs.includes("shipped")
  const tracking = fulfillments.flatMap((f) => f.labels ?? []).filter((l) => l.tracking_number || l.tracking_url)

  const placed = new Date(order.created_at as unknown as string)
  const expected = (() => {
    if (!policies || delivered || canceled) return null
    const from = shippedAt ? new Date(shippedAt) : placed
    const min = shippedAt ? policies.transitDays.min : policies.handlingDays.min + policies.transitDays.min
    const max = shippedAt ? policies.transitDays.max : policies.handlingDays.max + policies.transitDays.max
    const a = addBusinessDays(from, min)
    const b = addBusinessDays(from, max)
    return { a, b, late: new Date() > addBusinessDays(b, 2) }
  })()

  const steps = [
    { title: "Besteld", body: `Op ${shortDate(placed)}. Je betaling is binnen.`, done: true },
    {
      title: "Wordt klaargemaakt",
      body: "We maken je bestelling klaar voor verzending.",
      done: shipped,
    },
    {
      title: "Onderweg",
      body: shippedAt ? `Verzonden op ${shortDate(new Date(shippedAt))}.` : "Zodra je pakket onderweg is, krijg je een e-mail met de track & trace.",
      done: shipped,
    },
    { title: "Bezorgd", body: deliveredAt ? `Op ${shortDate(new Date(deliveredAt))}.` : "", done: delivered },
  ]
  const currentIndex = steps.findIndex((s) => !s.done)

  return (
    <div className="content-container max-w-2xl py-16 text-brand-ink small:py-24">
      <p className="text-sm text-brand-muted">Bestelling #{order.display_id}</p>
      <h1 className="mt-2 font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.05]">
        {canceled ? "Je bestelling is geannuleerd" : delivered ? "Je bestelling is bezorgd" : shipped ? "Je bestelling is onderweg" : "We maken je bestelling klaar"}
      </h1>

      {expected && (
        <p className="mt-4 text-lg">
          Verwacht tussen {shortDate(expected.a)} en {shortDate(expected.b)}.
        </p>
      )}

      {!canceled && (
        <ol className="mt-10 border-l border-brand-ink/15" aria-label="Status van je bestelling">
          {steps.map((s, i) => (
            <li key={s.title} className="relative pb-8 pl-8 last:pb-0" aria-current={i === currentIndex ? "step" : undefined}>
              <span
                aria-hidden
                className={`absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
                  s.done ? "border-brand-ink bg-brand-ink" : i === currentIndex ? "border-brand-ink bg-brand-light" : "border-brand-ink/25 bg-brand-light"
                }`}
              />
              <p className={`text-lg ${s.done || i === currentIndex ? "font-medium" : "text-brand-ink/50"}`}>{s.title}</p>
              {s.body && (s.done || i === currentIndex) && <p className="mt-1 text-base text-brand-ink/75">{s.body}</p>}
            </li>
          ))}
        </ol>
      )}

      {shipped && tracking.length > 0 && (
        <div className="mt-10 border-t border-brand-ink/10 pt-6">
          <p className="text-base">
            Trackingnummer: <strong>{tracking.map((t) => t.tracking_number).filter(Boolean).join(", ")}</strong>
          </p>
          <p className="mt-1 text-sm text-brand-ink/70">
            De eerste updates kunnen een paar dagen op zich laten wachten. Je pakket is dan wel al onderweg.
          </p>
          {tracking.find((t) => t.tracking_url)?.tracking_url && (
            <a
              href={tracking.find((t) => t.tracking_url)!.tracking_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-base underline underline-offset-4"
            >
              Bekijk de details bij de vervoerder
            </a>
          )}
        </div>
      )}

      <div className="mt-10 rounded-[4px] bg-brand-dark/5 p-5 text-base">
        {expected?.late ? (
          <p>
            Duurt het langer dan verwacht? Dat spijt ons. Mail ons op{" "}
            {store.company.email ? <a className="underline" href={`mailto:${store.company.email}`}>{store.company.email}</a> : "ons e-mailadres"}{" "}
            met je bestelnummer, dan zoeken we het meteen voor je uit.
          </p>
        ) : (
          <p>
            Vragen over je bestelling? Mail ons op{" "}
            {store.company.email ? <a className="underline" href={`mailto:${store.company.email}`}>{store.company.email}</a> : "ons e-mailadres"}{" "}
            met je bestelnummer. We antwoorden binnen één werkdag.
          </p>
        )}
      </div>
    </div>
  )
}
