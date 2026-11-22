import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"

/**
 * E-mail versturen via de HTTP-API van Resend of Brevo (geen SDK nodig).
 * De inhoud (onderwerp, HTML, tekst) maken de subscribers met src/lib/emails;
 * deze provider verstuurt alleen.
 *
 * - Resend: https://resend.com (gratis tot 3.000 mails/maand)
 * - Brevo: https://brevo.com (EU-bedrijf, gratis tot 300 mails/dag)
 *
 * Domein verifiëren (SPF/DKIM) bij de provider, anders komen mails in de spam.
 */
export type EmailOptions = {
  provider: "resend" | "brevo"
  apiKey: string
  /** Afzender, bv. "Lichtval <hallo@lichtval.nl>". */
  from: string
  /** Waar antwoorden van klanten heen gaan (bv. je eigen inbox). */
  replyTo?: string
}

type Deps = { logger: Logger }

/** "Lichtval <hallo@lichtval.nl>" → { name: "Lichtval", email: "hallo@lichtval.nl" } */
export function parseAddress(value: string): { name?: string; email: string } {
  const m = value.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/)
  return m ? { name: m[1].replace(/^"|"$/g, "") || undefined, email: m[2] } : { email: value.trim() }
}

export default class EmailNotificationService extends AbstractNotificationProviderService {
  static identifier = "email"
  protected options_: EmailOptions
  protected logger_: Logger

  static validateOptions(options: Record<string, unknown>) {
    if (!options.apiKey || !options.from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "E-mail: apiKey en from zijn verplicht")
    }
  }

  constructor({ logger }: Deps, options: EmailOptions) {
    super()
    this.logger_ = logger
    this.options_ = options
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const subject = notification.content?.subject
    const html = notification.content?.html
    const text = notification.content?.text
    if (!subject || (!html && !text)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `E-mail "${notification.template}" heeft geen onderwerp of inhoud`
      )
    }
    const from = notification.from || this.options_.from
    const replyTo = (notification.provider_data?.reply_to as string | undefined) || this.options_.replyTo

    const { url, headers, body } =
      this.options_.provider === "brevo"
        ? {
            url: "https://api.brevo.com/v3/smtp/email",
            headers: { "api-key": this.options_.apiKey },
            body: {
              sender: parseAddress(from),
              to: [{ email: notification.to }],
              subject,
              htmlContent: html,
              textContent: text,
              ...(replyTo ? { replyTo: parseAddress(replyTo) } : {}),
              tags: [notification.template],
            },
          }
        : {
            url: "https://api.resend.com/emails",
            headers: { Authorization: `Bearer ${this.options_.apiKey}` },
            body: {
              from,
              to: [notification.to],
              subject,
              html,
              text,
              ...(replyTo ? { reply_to: replyTo } : {}),
              tags: [{ name: "template", value: notification.template.replace(/[^\w-]/g, "_") }],
            },
          }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    })
    const json = (await res.json().catch(() => ({}))) as { id?: string; messageId?: string; message?: string }
    if (!res.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `E-mail via ${this.options_.provider} mislukt (${res.status}): ${json.message ?? "onbekende fout"}`
      )
    }
    this.logger_.info(`[email] "${notification.template}" verstuurd naar ${notification.to}`)
    return { id: json.id ?? json.messageId }
  }
}
