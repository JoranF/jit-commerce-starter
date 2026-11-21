/** Healthcheck voor Dokploy/Docker: nieuwe versie gaat pas live als dit 200 geeft. */
export const dynamic = "force-dynamic"

export function GET() {
  return Response.json({ ok: true })
}
