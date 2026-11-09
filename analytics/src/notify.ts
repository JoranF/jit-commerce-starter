import { appendFile, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

/**
 * Stuur een rapport naar:
 *  - reports/<naam>.md (altijd)
 *  - GitHub Actions job summary (als $GITHUB_STEP_SUMMARY bestaat)
 *  - REPORT_WEBHOOK_URL: Discord of Slack incoming webhook (optioneel)
 */
export async function publish(name: string, markdown: string) {
  const dir = path.resolve(process.cwd(), "reports")
  await mkdir(dir, { recursive: true })
  const file = path.join(dir, `${name}.md`)
  await writeFile(file, markdown)
  console.log(`📝 Rapport opgeslagen: ${file}`)

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown + "\n")
  }

  const hook = process.env.REPORT_WEBHOOK_URL
  if (hook) {
    const isDiscord = hook.includes("discord.com") || hook.includes("discordapp.com")
    // Discord: max 2000 tekens per bericht; Slack: ~40k. Knip netjes af.
    const limit = isDiscord ? 1900 : 35000
    const text = markdown.length > limit ? markdown.slice(0, limit) + "\n…(ingekort)" : markdown
    const body = isDiscord ? { content: text } : { text }
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) console.warn(`Webhook gaf ${res.status}: ${await res.text()}`)
    else console.log("📨 Verstuurd naar webhook")
  }
}

export const eur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n)

export const int = (n: number) => new Intl.NumberFormat("nl-NL").format(Math.round(n))

export function delta(curr: number, prev: number) {
  if (!prev) return curr ? "nieuw" : "–"
  const d = (curr - prev) / prev
  const arrow = d > 0.005 ? "▲" : d < -0.005 ? "▼" : "▬"
  return `${arrow} ${d >= 0 ? "+" : ""}${(d * 100).toFixed(1)}%`
}

export function table(headers: string[], rows: (string | number)[][]) {
  const head = `| ${headers.join(" | ")} |`
  const sep = `| ${headers.map(() => "---").join(" | ")} |`
  return [head, sep, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n")
}
