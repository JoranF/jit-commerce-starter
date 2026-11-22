import { store } from "@stores"

/**
 * Productveiligheid (GPSR): fabrikant, verantwoordelijke in de EU, kenmerk en
 * waarschuwingen. Verplicht bij online verkoop; uitklapbaar zodat het niet afleidt.
 */
export default function ProductSafety() {
  const s = store.productSafety
  if (!s) return null
  return (
    <details className="group mt-8 border-t border-brand-ink/10 pt-4 text-sm">
      <summary className="cursor-pointer list-none text-brand-muted underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
        Productveiligheid en fabrikant
      </summary>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt className="text-brand-muted">Fabrikant</dt>
        <dd>{s.manufacturer}</dd>
        <dt className="text-brand-muted">Verantwoordelijke in de EU</dt>
        <dd>{s.euResponsible}</dd>
        {s.identifier && (
          <>
            <dt className="text-brand-muted">Kenmerk</dt>
            <dd>{s.identifier}</dd>
          </>
        )}
      </dl>
      {!!s.warnings?.length && (
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {s.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </details>
  )
}
