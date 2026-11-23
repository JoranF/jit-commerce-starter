import { createRequire } from "node:module"
import { MedusaError } from "@medusajs/framework/utils"
import { in3PaymentExtras, type In3Billing } from "./params"

// De basisklasse van de Mollie-plugin wordt niet geëxporteerd; via package.json vinden we hem.
const req = createRequire(__filename)
const pluginRoot = req.resolve("@variablevic/mollie-payments-medusa/package.json").replace(/package\.json$/, "")
const MollieBase = req(`${pluginRoot}.medusa/server/src/providers/mollie/core/mollie-base.js`).default

export const IN3_IDENTIFIER = "mollie-in3"

/**
 * Mollie in3: in 3 termijnen betalen, zonder rente. Provider-id in Medusa:
 * `pp_mollie-in3_mollie`. Zet in3 aan in het Mollie-dashboard; de bootstrap koppelt hem
 * aan de regio. Statussen en webhooks werken zoals bij iDEAL (zelfde basisklasse).
 */
class MollieIn3Service extends MollieBase {
  static identifier = IN3_IDENTIFIER

  get paymentCreateOptions() {
    return {
      method: "in3",
      webhookUrl: `${this.options_.medusaUrl}/hooks/payment/${IN3_IDENTIFIER}_mollie`,
      captureMethod: "automatic",
    }
  }

  async initiatePayment(input: { amount: unknown; currency_code: string; data?: Record<string, unknown>; context?: any }) {
    const { amount, currency_code, data, context } = input
    const billing = (data?.billing ?? {}) as In3Billing
    const extras = in3PaymentExtras(
      { ...billing, email: billing.email || context?.customer?.email },
      Number(amount),
      currency_code,
      this.options_.description || "Bestelling"
    )
    try {
      const payment = await this.client_.payments.create({
        ...this.normalizePaymentCreateParams(),
        ...extras,
        amount: extras.lines[0].totalAmount,
        description: this.options_.description || "Bestelling",
        redirectUrl: this.options_.redirectUrl,
        metadata: { idempotency_key: context?.idempotency_key },
      })
      return { id: payment.id, data: payment }
    } catch (e) {
      this.logger_.error(`Mollie in3 payment creation failed: ${(e as Error).message}`)
      throw new MedusaError(MedusaError.Types.INVALID_DATA, (e as Error).message)
    }
  }
}

export default MollieIn3Service
