#!/usr/bin/env node
/**
 * Eén commando om de webshop lokaal klaar te zetten (Windows, macOS, Linux):
 *
 *   pnpm setup:local            # met Docker (start Postgres + Redis)
 *   pnpm setup:local --no-docker  # je eigen Postgres; zet DATABASE_URL in apps/backend/.env
 *
 * Daarna: pnpm dev  →  winkel http://localhost:8000, admin http://localhost:9000/app
 *
 * Idempotent: bestaande .env-bestanden en data blijven staan.
 */
import { execSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const args = new Set(process.argv.slice(2))
const useDocker = !args.has("--no-docker")

const run = (cmd, opts = {}) => {
  console.log(`\n$ ${cmd}`)
  execSync(cmd, { stdio: "inherit", cwd: root, shell: true, ...opts })
}
const tryRun = (cmd, opts = {}) => {
  try {
    execSync(cmd, { stdio: "ignore", cwd: root, shell: true, ...opts })
    return true
  } catch {
    return false
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function setEnv(file, key, value) {
  let s = readFileSync(file, "utf8")
  const re = new RegExp(`^${key}=.*$`, "m")
  s = re.test(s) ? s.replace(re, `${key}=${value}`) : `${s.trimEnd()}\n${key}=${value}\n`
  writeFileSync(file, s)
}
function getEnv(file, key) {
  const m = readFileSync(file, "utf8").match(new RegExp(`^${key}=(.*)$`, "m"))
  return m?.[1]?.trim() || ""
}

async function main() {
  const [major, minor] = process.versions.node.split(".").map(Number)
  if (major < 22 || (major === 22 && minor < 23)) {
    console.error(`✗ Node ${process.versions.node} gevonden; nodig: 22.23 of nieuwer (https://nodejs.org).`)
    process.exit(1)
  }

  // 1. Env-bestanden
  const backendEnv = path.join(root, "apps/backend/.env")
  const storeEnv = path.join(root, "apps/storefront/.env.local")
  if (!existsSync(backendEnv)) {
    copyFileSync(path.join(root, "apps/backend/.env.template"), backendEnv)
    setEnv(backendEnv, "MEDUSA_PUBLISHABLE_KEY", `pk_${randomBytes(32).toString("hex")}`)
    setEnv(backendEnv, "MEDUSA_ADMIN_EMAIL", "admin@webshop.local")
    setEnv(backendEnv, "MEDUSA_ADMIN_PASSWORD", "supersecret")
    setEnv(backendEnv, "JWT_SECRET", randomBytes(32).toString("hex"))
    setEnv(backendEnv, "COOKIE_SECRET", randomBytes(32).toString("hex"))
    console.log("✓ apps/backend/.env aangemaakt")
  }
  const pk = getEnv(backendEnv, "MEDUSA_PUBLISHABLE_KEY")
  if (!pk) {
    setEnv(backendEnv, "MEDUSA_PUBLISHABLE_KEY", `pk_${randomBytes(32).toString("hex")}`)
  }
  if (!existsSync(storeEnv)) {
    copyFileSync(path.join(root, "apps/storefront/.env.template"), storeEnv)
    setEnv(storeEnv, "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY", getEnv(backendEnv, "MEDUSA_PUBLISHABLE_KEY"))
    console.log("✓ apps/storefront/.env.local aangemaakt")
  }

  // 2. Database
  if (useDocker) {
    if (!tryRun("docker info")) {
      console.error(
        "✗ Docker draait niet. Start Docker Desktop, of gebruik je eigen Postgres:\n" +
          "  zet DATABASE_URL in apps/backend/.env en draai: pnpm setup:local --no-docker"
      )
      process.exit(1)
    }
    run("docker compose -f docker-compose.dev.yml up -d")
    process.stdout.write("Wachten op Postgres")
    for (let i = 0; i < 60; i++) {
      if (tryRun("docker compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres")) break
      process.stdout.write(".")
      await sleep(1000)
    }
    console.log(" ✓")
  }

  // 3. Dependencies, migraties (+ NL-winkel seeden), bootstrap
  if (!existsSync(path.join(root, "node_modules"))) run("pnpm install")
  run("pnpm medusa db:migrate", { cwd: path.join(root, "apps/backend") })
  run("pnpm medusa exec ./src/scripts/bootstrap.ts", { cwd: path.join(root, "apps/backend") })

  console.log(`
✅ Klaar! Start alles met:

   pnpm dev

   Winkel:  http://localhost:8000
   Admin:   http://localhost:9000/app
            ${getEnv(backendEnv, "MEDUSA_ADMIN_EMAIL")} / ${getEnv(backendEnv, "MEDUSA_ADMIN_PASSWORD")}

Testbestelling: kies "Testbetaling (handmatig)" bij het afrekenen.
`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
