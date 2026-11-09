/**
 * Optioneel: laat Claude op basis van de cijfers concrete A/B-test-ideeën voorstellen.
 * Alleen actief als ANTHROPIC_API_KEY gezet is. Er worden alleen geaggregeerde
 * cijfers gestuurd (geen persoonsgegevens).
 */

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5"

export async function suggestExperiments(metricsMarkdown: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null

  const prompt = `Je bent een conversie-specialist (CRO) voor een kleine Nederlandse webshop
(Medusa + Next.js, betalen via Mollie/iDEAL). Hieronder staan de cijfers van de afgelopen week.

${metricsMarkdown}

Geef de 3 A/B-tests met de hoogste verwachte impact voor volgende week. Per test:
- **Probleem** (welk cijfer laat dit zien)
- **Hypothese** ("Als we X, dan stijgt Y, omdat Z")
- **Variant** (concreet: tekst/element/pagina)
- **Primaire metric** (een van: product_added_to_cart, checkout_started, order_completed)
- **Feature flag key** (kebab-case)

Wees concreet en eerlijk: als er te weinig verkeer is voor betrouwbare tests,
zeg dat en adviseer wat in plaats daarvan (bv. gebruikersinterviews, sessie-opnames).
Antwoord in het Nederlands, maximaal 350 woorden.`

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    })
    if (!res.ok) {
      console.warn(`AI-suggesties mislukt: ${res.status} ${await res.text()}`)
      return null
    }
    const data = (await res.json()) as { content: { type: string; text?: string }[] }
    return data.content.filter((c) => c.type === "text").map((c) => c.text).join("\n").trim()
  } catch (e) {
    console.warn(`AI-suggesties mislukt: ${(e as Error).message}`)
    return null
  }
}
