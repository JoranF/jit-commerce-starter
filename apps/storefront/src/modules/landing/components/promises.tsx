import { fillPolicy, store, type PolicyValues } from "@stores"

/**
 * Levertijd, bedenktijd en garantie. Termijnen komen uit het winkelbeleid van de
 * regio; ontbreekt er een, dan valt die regel weg in plaats van iets te beloven.
 */
export default function Promises({
  values,
  className = "",
}: {
  values: PolicyValues
  className?: string
}) {
  const lines = store.buy.promises
    .map((p) => fillPolicy(p, values))
    .filter((p): p is string => !!p)

  if (!lines.length) {
    return null
  }

  return (
    <ul className={`divide-y divide-brand-ink/10 border-y border-brand-ink/10 ${className}`}>
      {lines.map((line) => (
        <li key={line} className="flex items-center gap-3 py-3 text-base">
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="h-4 w-4 shrink-0 text-brand-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M4 10.5l3.5 3.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {line}
        </li>
      ))}
    </ul>
  )
}
