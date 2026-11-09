#!/bin/sh
set -e
cd /app

if [ "${MEDUSA_WORKER_MODE:-shared}" != "worker" ]; then
  echo "▶ Database migraties (eerste keer: winkel + demo-producten seeden)…"
  ./node_modules/.bin/medusa db:migrate
  echo "▶ Bootstrap (vaste publishable key, admin-gebruiker)…"
  ./node_modules/.bin/medusa exec ./src/scripts/bootstrap.js || echo "⚠ bootstrap faalde, ga toch door"
fi

echo "▶ Medusa starten (mode: ${MEDUSA_WORKER_MODE:-shared})"
exec ./node_modules/.bin/medusa start
