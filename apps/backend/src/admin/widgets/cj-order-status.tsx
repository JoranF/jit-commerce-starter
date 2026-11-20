import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, StatusBadge, Text, toast } from "@medusajs/ui"
import { useState } from "react"

type Meta = Record<string, unknown>

const STATUS: Record<string, { label: string; color: "green" | "orange" | "red" | "blue" | "grey" }> = {
  awaiting_payment: { label: "Wacht op betaling in CJ", color: "orange" },
  paid: { label: "Betaald, wordt verwerkt", color: "blue" },
  processing: { label: "In behandeling bij CJ", color: "blue" },
  shipped: { label: "Verzonden", color: "green" },
  delivered: { label: "Bezorgd", color: "green" },
  cancelled: { label: "Geannuleerd bij CJ", color: "red" },
  error: { label: "Doorsturen mislukt", color: "red" },
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-2 items-start gap-2 px-6 py-2">
    <Text size="small" leading="compact" weight="plus">
      {label}
    </Text>
    <Text size="small" leading="compact" className="break-words [overflow-wrap:anywhere]">
      {children}
    </Text>
  </div>
)

const CjOrderStatusWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const meta = (order.metadata ?? {}) as Meta
  const [busy, setBusy] = useState<"forward" | "sync" | null>(null)
  const status = typeof meta.cj_status === "string" ? meta.cj_status : undefined
  const s = status ? STATUS[status] : undefined

  const call = async (action: "forward" | "sync") => {
    setBusy(action)
    try {
      const res = await fetch(`/admin/cj/orders/${order.id}/${action}`, {
        method: "POST",
        credentials: "include",
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body?.message ?? `HTTP ${res.status}`)
      }
      const r = body.result ?? {}
      if (r.status === "error" || r.error) {
        toast.error("CJ", { description: String(r.metadata?.cj_error ?? r.error) })
      } else if (r.status === "skipped") {
        toast.info("CJ", { description: "Geen CJ-producten in deze bestelling (variant metadata cj_vid)." })
      } else {
        toast.success("CJ", { description: action === "forward" ? "Doorgestuurd naar CJ" : `Status: ${r.status}` })
      }
      setTimeout(() => window.location.reload(), 800)
    } catch (e) {
      toast.error("CJ", { description: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">CJ Dropshipping</Heading>
        {s ? <StatusBadge color={s.color}>{s.label}</StatusBadge> : <StatusBadge color="grey">Niet doorgestuurd</StatusBadge>}
      </div>
      {meta.cj_order_id ? <Row label="CJ-order">{String(meta.cj_order_id)}</Row> : null}
      {meta.cj_order_number ? <Row label="Ordernummer">{String(meta.cj_order_number)}</Row> : null}
      {meta.cj_logistic ? (
        <Row label="Verzending">
          {String(meta.cj_logistic)}
          {meta.cj_from_country ? ` (vanuit ${String(meta.cj_from_country)})` : ""}
        </Row>
      ) : null}
      {meta.cj_amount_usd ? <Row label="Inkoop (USD)">${String(meta.cj_amount_usd)}</Row> : null}
      {meta.cj_tracking_number ? (
        <Row label="Track & trace">
          {meta.cj_tracking_url ? (
            <a className="text-ui-fg-interactive" href={String(meta.cj_tracking_url)} target="_blank" rel="noreferrer">
              {String(meta.cj_tracking_number)}
            </a>
          ) : (
            String(meta.cj_tracking_number)
          )}
        </Row>
      ) : null}
      {meta.cj_sandbox ? <Row label="Modus">Sandbox (geen echte verzending)</Row> : null}
      {meta.cj_error ? (
        <Row label="Fout">
          <span className="text-ui-fg-error">{String(meta.cj_error)}</span>
        </Row>
      ) : null}
      {meta.cj_fulfillment_error ? (
        <Row label="Fulfilment">
          <span className="text-ui-fg-error">{String(meta.cj_fulfillment_error)}</span>
        </Row>
      ) : null}
      <div className="flex gap-2 px-6 py-4">
        <Button size="small" variant="secondary" isLoading={busy === "forward"} onClick={() => call("forward")}>
          {meta.cj_order_id ? "Opnieuw doorsturen" : "Doorsturen naar CJ"}
        </Button>
        {meta.cj_order_id ? (
          <Button size="small" variant="secondary" isLoading={busy === "sync"} onClick={() => call("sync")}>
            Status ophalen
          </Button>
        ) : null}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default CjOrderStatusWidget
