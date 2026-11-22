import { store } from "@stores"

const Stars = ({ rating, label }: { rating: number; label?: string }) => (
  <span className="inline-flex text-brand-ink" role="img" aria-label={label ?? `${rating} van 5 sterren`}>
    {Array.from({ length: 5 }, (_, i) => (
      <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" aria-hidden fill={i < rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2">
        <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.8l-5.1 2.6 1-5.6-4.1-4 5.7-.8z" />
      </svg>
    ))}
  </span>
)

/** Gemiddelde en aantal; null als er (nog) geen echte reviews zijn. */
export function reviewSummary() {
  const reviews = store.reviews ?? []
  if (!reviews.length) return null
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  return { average: Math.round(avg * 10) / 10, count: reviews.length }
}

/** Kleine regel met sterren bij de prijs (alleen met echte reviews). */
export function RatingLine() {
  const s = reviewSummary()
  if (!s) return null
  return (
    <a href="#reviews" className="inline-flex items-center gap-2 text-sm text-brand-ink/80 hover:underline">
      <Stars rating={Math.round(s.average)} label={`Gemiddeld ${s.average} van 5 sterren`} />
      {s.average.toLocaleString("nl-NL")} · {s.count} {s.count === 1 ? "review" : "reviews"}
    </a>
  )
}

/** Wat klanten zeggen. Alleen echte reviews uit store.reviews (nooit verzonnen). */
export default function Reviews() {
  const reviews = [...(store.reviews ?? [])].sort((a, b) => b.date.localeCompare(a.date))
  const s = reviewSummary()
  if (!s) return null
  return (
    <section id="reviews" className="scroll-mt-16 border-t border-brand-ink/10 bg-brand-light py-20 text-brand-ink small:py-32" aria-labelledby="reviews-title">
      <div className="content-container">
        <h2 id="reviews-title" className="font-display text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.04] tracking-[-0.01em]">
          Wat klanten zeggen
        </h2>
        <p className="mt-4 flex items-center gap-3 text-base">
          <Stars rating={Math.round(s.average)} label={`Gemiddeld ${s.average} van 5 sterren`} />
          {s.average.toLocaleString("nl-NL")} van 5, op basis van {s.count} {s.count === 1 ? "review" : "reviews"}
        </p>
        <ul className="mt-10 grid gap-8 small:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <li key={`${r.name}-${r.date}`} className="border-t border-brand-ink/10 pt-6">
              <Stars rating={r.rating} />
              <p className="mt-3 text-base leading-relaxed">“{r.text}”</p>
              <p className="mt-3 text-sm text-brand-muted">
                {r.name}
                {r.city ? `, ${r.city}` : ""} ·{" "}
                {new Date(r.date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                {r.verified ? " · geverifieerde aankoop" : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
