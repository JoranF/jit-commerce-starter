import { store } from "@stores"
import Bancontact from "@modules/common/icons/bancontact"
import Ideal from "@modules/common/icons/ideal"
import PayPal from "@modules/common/icons/paypal"
import type { ReactNode } from "react"

const LABELS: Record<string, { label: string; icon?: ReactNode }> = {
  ideal: { label: "iDEAL", icon: <Ideal /> },
  bancontact: { label: "Bancontact", icon: <Bancontact /> },
  card: { label: "Creditcard" },
  paypal: { label: "PayPal", icon: <PayPal /> },
  applepay: { label: "Apple Pay" },
}

/** "Veilig betalen" met de betaalmethodes, vlak onder de koopknop. */
export default function PaymentMethods({ className = "" }: { className?: string }) {
  const methods = store.paymentMethods ?? ["ideal", "bancontact", "card", "paypal"]
  return (
    <div className={className}>
      <p className="text-sm text-brand-muted">Veilig betalen via Mollie</p>
      <ul className="mt-2 flex flex-wrap gap-2" aria-label="Betaalmethodes">
        {methods.map((m) => (
          <li
            key={m}
            className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-brand-ink/15 bg-white/70 px-2.5 text-xs font-medium text-brand-ink"
          >
            {LABELS[m]?.icon && <span className="[&_svg]:h-4 [&_svg]:w-4">{LABELS[m].icon}</span>}
            {LABELS[m]?.label ?? m}
          </li>
        ))}
      </ul>
    </div>
  )
}
