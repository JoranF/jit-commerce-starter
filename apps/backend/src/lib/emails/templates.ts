import { deliveryWindow, esc, eur, type DeliveryPolicy } from "./format"

/**
 * E-mails aan klanten (en een melding aan de winkelier), als pure functies:
 * order + merk erin, { subject, html, text } eruit. Getest in __tests__.
 *
 * Wettelijk (BW 6:230v): na een verkoop op afstand krijgt de klant de bevestiging
 * op een duurzame gegevensdrager, met je bedrijfsgegevens, de prijs en het
 * herroepingsrecht (inclusief het modelformulier). De orderbevestiging doet dat.
 */

export type Brand = {
  name: string
  /** Publieke URL van de winkel, zonder / aan het eind. */
  siteUrl: string
  colors: { dark: string; light: string; accent: string }
  company: { legalName?: string; kvk?: string; vat?: string; address?: string; email?: string }
}

export type EmailItem = {
  title?: string | null
  product_title?: string | null
  variant_title?: string | null
  quantity?: unknown
  unit_price?: unknown
  total?: unknown
}

export type EmailOrder = {
  id: string
  display_id?: number | string | null
  email?: string | null
  currency_code?: string | null
  created_at?: string | Date | null
  total?: unknown
  subtotal?: unknown
  item_total?: unknown
  shipping_total?: unknown
  discount_total?: unknown
  tax_total?: unknown
  items?: EmailItem[] | null
  shipping_address?: {
    first_name?: string | null
    last_name?: string | null
    company?: string | null
    address_1?: string | null
    address_2?: string | null
    postal_code?: string | null
    city?: string | null
    country_code?: string | null
  } | null
}

export type RenderedEmail = { subject: string; html: string; text: string }

const orderNo = (o: EmailOrder) => `#${o.display_id ?? o.id}`
const country = (o: EmailOrder) => (o.shipping_address?.country_code || "nl").toLowerCase()
const link = (b: Brand, o: EmailOrder, path: string) =>
  b.siteUrl ? `${b.siteUrl}/${country(o)}${path}` : ""

const itemName = (i: EmailItem) => {
  const base = i.product_title || i.title || "Product"
  const variant = i.variant_title && i.variant_title !== "Default variant" ? ` (${i.variant_title})` : ""
  return `${base}${variant}`
}

function addressLines(o: EmailOrder): string[] {
  const a = o.shipping_address
  if (!a) {
    return []
  }
  return [
    [a.first_name, a.last_name].filter(Boolean).join(" "),
    a.company,
    [a.address_1, a.address_2].filter(Boolean).join(", "),
    [a.postal_code, a.city].filter(Boolean).join(" "),
    a.country_code?.toUpperCase(),
  ].filter((l): l is string => !!l && !!l.trim())
}

/**
 * Bedrijfsgegevens onderaan de mail. Het adres alleen in de orderbevestiging (daar
 * is het wettelijk nodig, BW 6:230v); de andere mails zonder adres.
 */
function companyLines(b: Brand, withAddress = false): string[] {
  const c = b.company
  return [
    c.legalName,
    withAddress ? c.address : undefined,
    c.email,
    c.kvk ? `KvK ${c.kvk}` : undefined,
    c.vat ? `Btw ${c.vat}` : undefined,
  ].filter((l): l is string => !!l)
}

/** Eenvoudige, robuuste mail-layout (tabellen + inline styles, werkt ook in Outlook). */
function layout(b: Brand, opts: { preheader: string; title: string; body: string; withAddress?: boolean }) {
  const { dark, light, accent } = b.colors
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${light};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${light};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:4px;">
<tr><td style="background:${dark};padding:24px 32px;border-radius:4px 4px 0 0;border-bottom:3px solid ${accent};">
<span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:${light};">${esc(b.name)}</span>
</td></tr>
<tr><td style="padding:32px;font-family:${font};font-size:16px;line-height:1.55;color:#1b2a2d;">
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:1.2;color:${dark};">${esc(opts.title)}</h1>
${opts.body}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e3e6e3;font-family:${font};font-size:12px;line-height:1.6;color:#5f7374;">
${companyLines(b, opts.withAddress).map(esc).join("<br>")}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

const p = (html: string) => `<p style="margin:0 0 16px;">${html}</p>`
const h2 = (text: string, color: string) =>
  `<h2 style="margin:28px 0 8px;font-size:16px;color:${color};">${esc(text)}</h2>`
const button = (b: Brand, href: string, label: string) =>
  `<p style="margin:24px 0;"><a href="${esc(href)}" style="display:inline-block;background:${b.colors.dark};color:${b.colors.light};text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;">${esc(label)}</a></p>`

function itemsTable(o: EmailOrder) {
  const cur = o.currency_code || "EUR"
  const rows = (o.items ?? [])
    .map(
      (i) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid #e3e6e3;">${Number(i.quantity ?? 1)} × ${esc(itemName(i))}</td>
<td style="padding:8px 0;border-bottom:1px solid #e3e6e3;text-align:right;white-space:nowrap;">${eur(i.total ?? Number(i.unit_price ?? 0) * Number(i.quantity ?? 1), cur)}</td>
</tr>`
    )
    .join("")
  const line = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:6px 0;${strong ? "font-weight:700;" : ""}">${label}</td><td style="padding:6px 0;text-align:right;white-space:nowrap;${strong ? "font-weight:700;" : ""}">${value}</td></tr>`
  const discount = Number(o.discount_total ?? 0)
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;font-size:15px;">
${rows}
${discount > 0 ? line("Korting", `− ${eur(discount, cur)}`) : ""}
${line("Verzending", Number(o.shipping_total ?? 0) > 0 ? eur(o.shipping_total, cur) : "Gratis")}
${line("Totaal", eur(o.total, cur), true)}
<tr><td colspan="2" style="padding:0;font-size:13px;color:#5f7374;">Inclusief ${eur(o.tax_total, cur)} btw</td></tr>
</table>`
}

function itemsText(o: EmailOrder) {
  const cur = o.currency_code || "EUR"
  return [
    ...(o.items ?? []).map(
      (i) => `${Number(i.quantity ?? 1)} × ${itemName(i)}  ${eur(i.total ?? Number(i.unit_price ?? 0) * Number(i.quantity ?? 1), cur)}`
    ),
    `Verzending  ${Number(o.shipping_total ?? 0) > 0 ? eur(o.shipping_total, cur) : "Gratis"}`,
    `Totaal  ${eur(o.total, cur)} (incl. ${eur(o.tax_total, cur)} btw)`,
  ].join("\n")
}

export type ConfirmationPolicy = DeliveryPolicy & { return_window_days?: number }

export function orderConfirmation(
  o: EmailOrder,
  b: Brand,
  opts: { policy?: ConfirmationPolicy | null } = {}
): RenderedEmail {
  const firstName = o.shipping_address?.first_name?.trim()
  const placed = o.created_at ? new Date(o.created_at) : new Date()
  const window = deliveryWindow(placed, opts.policy)
  const days = Number(opts.policy?.return_window_days ?? 14)
  const returnsUrl = link(b, o, "/returns")
  const termsUrl = link(b, o, "/terms")
  const statusUrl = link(b, o, `/order/${o.id}/status`)
  const subject = `Je bestelling bij ${b.name} (${orderNo(o)})`
  const intro = window
    ? `We hebben je bestelling en je betaling ontvangen. Je bestelling komt naar verwachting ${window} aan. Zodra hij onderweg is, mailen we je de track &amp; trace-code.`
    : "We hebben je bestelling en je betaling ontvangen. Zodra hij onderweg is, mailen we je de track &amp; trace-code."
  const address = addressLines(o)

  const body = [
    p(firstName ? `Hoi ${esc(firstName)},` : "Hoi,"),
    p(intro),
    statusUrl ? button(b, statusUrl, "Volg je bestelling") : "",
    h2(`Bestelling ${orderNo(o)}`, b.colors.dark),
    itemsTable(o),
    address.length ? h2("Bezorgadres", b.colors.dark) + p(address.map(esc).join("<br>")) : "",
    h2("Bedenktijd", b.colors.dark),
    p(
      `Je hebt ${days} dagen bedenktijd, vanaf de dag nadat je de bestelling hebt ontvangen. Wil je hem terugsturen? Antwoord op deze e-mail${
        returnsUrl
          ? `, of gebruik het <a href="${esc(returnsUrl)}" style="color:${b.colors.dark};">modelformulier voor herroeping</a>`
          : ""
      }. Op je bestelling zijn${
        termsUrl
          ? ` <a href="${esc(termsUrl)}" style="color:${b.colors.dark};">de algemene voorwaarden</a>`
          : " de algemene voorwaarden"
      } van toepassing.`
    ),
    p("Vragen? Antwoord gewoon op deze e-mail."),
  ].join("\n")

  const text = [
    firstName ? `Hoi ${firstName},` : "Hoi,",
    "",
    intro.replace(/&amp;/g, "&"),
    ...(statusUrl ? ["", `Volg je bestelling: ${statusUrl}`] : []),
    "",
    `Bestelling ${orderNo(o)}`,
    itemsText(o),
    ...(address.length ? ["", "Bezorgadres", ...address] : []),
    "",
    "Bedenktijd",
    `Je hebt ${days} dagen bedenktijd, vanaf de dag nadat je de bestelling hebt ontvangen. Wil je hem terugsturen? Antwoord op deze e-mail${returnsUrl ? ` of gebruik het modelformulier: ${returnsUrl}` : ""}.`,
    termsUrl ? `Algemene voorwaarden: ${termsUrl}` : "",
    "",
    "Vragen? Antwoord gewoon op deze e-mail.",
    "",
    ...companyLines(b, true),
  ].join("\n")

  return {
    subject,
    html: layout(b, {
      preheader: `We hebben je bestelling ${orderNo(o)} ontvangen.`,
      title: "Bedankt voor je bestelling",
      body,
      withAddress: true,
    }),
    text,
  }
}

export type Tracking = { number?: string | null; url?: string | null }

export function orderShipped(
  o: EmailOrder,
  b: Brand,
  opts: { tracking: Tracking[]; policy?: DeliveryPolicy | null; shippedAt?: Date }
): RenderedEmail {
  const firstName = o.shipping_address?.first_name?.trim()
  const tracking = opts.tracking.filter((t) => t.number || t.url)
  const first = tracking.find((t) => t.url) ?? tracking[0]
  // Na verzending rest alleen de bezorgtijd.
  const window = deliveryWindow(opts.shippedAt ?? new Date(), {
    handling_days_min: 0,
    handling_days_max: 0,
    transit_days_min: opts.policy?.transit_days_min,
    transit_days_max: opts.policy?.transit_days_max,
  })
  const subject = `Je bestelling is onderweg (${orderNo(o)})`
  const numbers = tracking.map((t) => t.number).filter(Boolean).join(", ")
  // Eigen pagina "Volg je bestelling" (Nederlandse stappen + verwachte datum) als
  // hoofdlink; de site van de vervoerder als extra.
  const statusUrl = link(b, o, `/order/${o.id}/status`)
  const primaryUrl = statusUrl || first?.url

  const body = [
    p(firstName ? `Goed nieuws, ${esc(firstName)}: je bestelling is onderweg.` : "Goed nieuws: je bestelling is onderweg."),
    window ? p(`Hij komt naar verwachting ${window} aan.`) : "",
    primaryUrl ? button(b, primaryUrl, "Volg je pakket") : "",
    numbers
      ? p(
          `Trackingnummer: <strong>${esc(numbers)}</strong>${
            statusUrl && first?.url
              ? ` · <a href="${esc(first.url)}" style="color:${b.colors.dark};">details bij de vervoerder</a>`
              : ""
          }`
        )
      : "",
    p(
      "Het kan een paar dagen duren voordat de eerste update in de track &amp; trace staat. Dat is normaal: je pakket is dan al wel onderweg."
    ),
    h2(`Bestelling ${orderNo(o)}`, b.colors.dark),
    p((o.items ?? []).map((i) => `${Number(i.quantity ?? 1)} × ${esc(itemName(i))}`).join("<br>")),
    p("Vragen? Antwoord gewoon op deze e-mail."),
  ].join("\n")

  const text = [
    firstName ? `Goed nieuws, ${firstName}: je bestelling is onderweg.` : "Goed nieuws: je bestelling is onderweg.",
    window ? `Hij komt naar verwachting ${window} aan.` : "",
    primaryUrl ? `Volg je pakket: ${primaryUrl}` : "",
    numbers ? `Trackingnummer: ${numbers}` : "",
    statusUrl && first?.url ? `Details bij de vervoerder: ${first.url}` : "",
    "Het kan een paar dagen duren voordat de eerste update in de track & trace staat.",
    "",
    `Bestelling ${orderNo(o)}`,
    ...(o.items ?? []).map((i) => `${Number(i.quantity ?? 1)} × ${itemName(i)}`),
    "",
    "Vragen? Antwoord gewoon op deze e-mail.",
    "",
    ...companyLines(b),
  ]
    .filter((l, i, all) => l !== "" || all[i - 1] !== "")
    .join("\n")

  return {
    subject,
    html: layout(b, { preheader: "Je pakket is onderweg. Volg het met de track & trace.", title: "Je bestelling is onderweg", body }),
    text,
  }
}

export function orderCanceled(o: EmailOrder, b: Brand): RenderedEmail {
  const firstName = o.shipping_address?.first_name?.trim()
  const subject = `Je bestelling is geannuleerd (${orderNo(o)})`
  const lines = [
    firstName ? `Hallo ${firstName},` : "Hallo,",
    `Je bestelling ${orderNo(o)} is geannuleerd.`,
    "Had je al betaald? Dan storten we het bedrag terug op je rekening. Afhankelijk van je bank zie je het binnen een paar werkdagen terug.",
    "Vragen? Antwoord gewoon op deze e-mail.",
  ]
  return {
    subject,
    html: layout(b, {
      preheader: `Je bestelling ${orderNo(o)} is geannuleerd.`,
      title: "Je bestelling is geannuleerd",
      body: lines.map((l) => p(esc(l))).join("\n"),
    }),
    text: [...lines, "", ...companyLines(b)].join("\n\n"),
  }
}

/** Melding aan de winkelier bij een nieuwe bestelling (SHOP_OWNER_EMAIL). */
export function ownerNewOrder(
  o: EmailOrder,
  b: Brand,
  opts: { adminUrl?: string; ad?: Record<string, unknown>; cjAutoPay?: boolean } = {}
): RenderedEmail {
  const where = [o.shipping_address?.city, o.shipping_address?.country_code?.toUpperCase()].filter(Boolean).join(", ")
  const ad = opts.ad ?? {}
  const source = [ad.ad_source, ad.ad_angle ? `invalshoek ${ad.ad_angle}` : undefined, ad.ad_ad ? `advertentie ${ad.ad_ad}` : undefined]
    .filter(Boolean)
    .join(" · ")
  const lines = [
    `Nieuwe bestelling ${orderNo(o)}: ${eur(o.total, o.currency_code || "EUR")}${where ? ` uit ${where}` : ""}.`,
    ...(o.items ?? []).map((i) => `${Number(i.quantity ?? 1)} × ${itemName(i)}`),
    source ? `Bron: ${source}` : "Bron: geen advertentie (direct of organisch)",
    opts.cjAutoPay === false
      ? "CJ_AUTO_PAY staat uit: betaal deze bestelling in je CJ-dashboard, anders wordt hij niet verstuurd."
      : "",
    opts.adminUrl ? `Bekijk: ${opts.adminUrl}/app/orders/${o.id}` : "",
  ].filter(Boolean)
  return {
    subject: `🛒 ${b.name}: bestelling ${orderNo(o)} (${eur(o.total, o.currency_code || "EUR")})`,
    html: layout(b, {
      preheader: lines[0],
      title: `Bestelling ${orderNo(o)}`,
      body: lines.map((l) => p(esc(l))).join("\n"),
    }),
    text: lines.join("\n"),
  }
}

/** Eén keer, als de vroegste verwachte datum voorbij is: "je pakket is nog onderweg". */
export function orderInTransit(
  o: EmailOrder,
  b: Brand,
  opts: { latest?: string | null; trackingUrl?: string | null } = {}
): RenderedEmail {
  const firstName = o.shipping_address?.first_name?.trim()
  const statusUrl = link(b, o, `/order/${o.id}/status`) || opts.trackingUrl || ""
  const lines = [
    firstName ? `Hoi ${firstName},` : "Hoi,",
    `Even een update over bestelling ${orderNo(o)}: je pakket is nog onderweg.${
      opts.latest ? ` Het komt naar verwachting uiterlijk ${opts.latest} aan.` : ""
    }`,
    "Je hoeft niets te doen. Is het er na die datum nog niet? Antwoord dan op deze e-mail, dan zoeken we het meteen voor je uit.",
  ]
  return {
    subject: `Je pakket is onderweg (${orderNo(o)})`,
    html: layout(b, {
      preheader: "Je pakket is nog onderweg. Hier zie je wanneer het aankomt.",
      title: "Nog even geduld",
      body: [...lines.map((l) => p(esc(l))), statusUrl ? button(b, statusUrl, "Volg je pakket") : ""].join("\n"),
    }),
    text: [...lines, statusUrl ? `Volg je pakket: ${statusUrl}` : "", "", ...companyLines(b)].filter(Boolean).join("\n\n"),
  }
}

/** Dagelijks lijstje voor de winkelier (alleen als er iets is). */
export function ownerCareDigest(b: Brand, issues: { message: string }[], adminUrl?: string): RenderedEmail {
  const lines = issues.map((i) => i.message)
  return {
    subject: `⚠️ ${b.name}: ${issues.length} ${issues.length === 1 ? "bestelling vraagt" : "bestellingen vragen"} aandacht`,
    html: layout(b, {
      preheader: lines[0] ?? "",
      title: "Bestellingen die aandacht vragen",
      body: [
        `<ul style="margin:0 0 16px;padding-left:20px;">${lines.map((l) => `<li style="margin:0 0 8px;">${esc(l)}</li>`).join("")}</ul>`,
        adminUrl ? p(`<a href="${esc(adminUrl)}/app/orders" style="color:${b.colors.dark};">Open de bestellingen in de admin</a>`) : "",
      ].join("\n"),
    }),
    text: [...lines.map((l) => `- ${l}`), adminUrl ? `\n${adminUrl}/app/orders` : ""].join("\n"),
  }
}

/**
 * Herinnering aan een niet afgeronde bestelling. Alleen voor mensen die er in de checkout
 * zelf om vroegen (vinkje, staat standaard uit); één keer per winkelmand. Rustig, zonder
 * korting of druk: alleen de link terug naar hun winkelmand.
 */
export function cartReminder(
  c: { id: string; email?: string | null; currency_code?: string | null; items?: EmailItem[] | null; total?: unknown; shipping_address?: { first_name?: string | null } | null },
  b: Brand,
  recoverUrl: string
): RenderedEmail {
  const firstName = c.shipping_address?.first_name?.trim()
  const cur = c.currency_code || "EUR"
  const items = (c.items ?? []).map((i) => `${Number(i.quantity ?? 1)}× ${itemName(i)}`)
  const lines = [
    firstName ? `Hoi ${firstName},` : "Hoi,",
    `Je was bijna klaar met je bestelling bij ${b.name}. We hebben je winkelmand voor je bewaard, dus je kunt verder waar je was.`,
    "Twijfel je nog, of liep er iets mis bij het betalen? Antwoord op deze e-mail, dan helpen we je.",
  ]
  const summary = `${items.join(", ")}${c.total != null ? ` · ${eur(c.total, cur)}` : ""}`
  const why = "Je krijgt deze ene e-mail omdat je bij het afrekenen om een herinnering vroeg. We sturen er geen tweede."
  return {
    subject: `Je winkelmand bij ${b.name} staat nog klaar`,
    html: layout(b, {
      preheader: "We hebben je winkelmand voor je bewaard.",
      title: "Je winkelmand staat nog klaar",
      body: [
        ...lines.map((l) => p(esc(l))),
        items.length ? p(`<strong>${esc(summary)}</strong>`) : "",
        button(b, recoverUrl, "Verder met bestellen"),
        p(`<span style="font-size:13px;opacity:.7;">${esc(why)}</span>`),
      ].join("\n"),
    }),
    text: [...lines, items.length ? summary : "", `Verder met bestellen: ${recoverUrl}`, why, "", ...companyLines(b)]
      .filter(Boolean)
      .join("\n\n"),
  }
}
