/**
 * `npm run stores` — JSON-lijst van actieve winkels voor de GitHub-workflows
 * (matrix). Met `--ads`: alleen winkels met een Meta-advertentieaccount.
 */
import { activeStores } from "./stores"

const onlyAds = process.argv.includes("--ads")
const ids = activeStores()
  .filter((s) => !onlyAds || s.meta?.adAccountId)
  .map((s) => s.id)
process.stdout.write(JSON.stringify(ids))
