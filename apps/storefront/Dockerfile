# ── Build ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install --immutable
COPY . .

# NEXT_PUBLIC_* worden tijdens de build in de code gebakken → build args.
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_REGION=nl
ARG NEXT_PUBLIC_POSTHOG_KEY=
ARG NEXT_PUBLIC_POSTHOG_UI_HOST=https://eu.posthog.com
ARG POSTHOG_API_HOST=https://eu.i.posthog.com
ARG POSTHOG_ASSETS_HOST=https://eu-assets.i.posthog.com
# Optioneel: backend-URL tijdens de build. Onbereikbaar = pagina's worden on-demand gerenderd.
ARG MEDUSA_BACKEND_URL=http://backend:9000
# Publieke backend-URL, voor productfoto's (next/image)
ARG MEDUSA_PUBLIC_BACKEND_URL=
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_POSTHOG_UI_HOST=$NEXT_PUBLIC_POSTHOG_UI_HOST \
    POSTHOG_API_HOST=$POSTHOG_API_HOST \
    POSTHOG_ASSETS_HOST=$POSTHOG_ASSETS_HOST \
    MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL \
    MEDUSA_PUBLIC_BACKEND_URL=$MEDUSA_PUBLIC_BACKEND_URL \
    NEXT_OUTPUT_STANDALONE=true \
    NEXT_TELEMETRY_DISABLED=1
RUN yarn build

# ── Runtime ───────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 8000
CMD ["node", "server.js"]
