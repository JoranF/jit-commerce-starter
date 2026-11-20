#!/bin/sh
set -e
cd /app

if [ "${MEDUSA_WORKER_MODE:-shared}" != "worker" ]; then
  echo "▶ Database migraties (eerste keer: winkel + demo-producten seeden)…"
  ./node_modules/.bin/medusa db:migrate
  echo "▶ Bootstrap (vaste publishable key, admin-gebruiker)…"
  ./node_modules/.bin/medusa exec ./src/scripts/bootstrap.js || echo "⚠ bootstrap faalde, ga toch door"
  if [ -n "${STORE_ID:-}" ]; then
    echo "▶ Winkel klaarzetten: ${STORE_ID} (product, levertijden; idempotent)…"
    ./node_modules/.bin/medusa exec ./src/scripts/stores/setup-store.js "${STORE_ID}" || echo "⚠ winkel-setup faalde, ga toch door"
  fi
fi

echo "▶ Medusa starten (mode: ${MEDUSA_WORKER_MODE:-shared})"
exec ./node_modules/.bin/medusa start
