# Build-context: de root van de repo (pnpm-workspace).
#   docker build -f apps/backend/Dockerfile .

# ── Build ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.11.1 --activate
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json apps/backend/
COPY apps/storefront/package.json apps/storefront/
RUN pnpm install --frozen-lockfile --filter @dtc/backend...
COPY apps/backend apps/backend
# De admin-UI wordt tijdens de build gebundeld en moet weten waar de API draait.
ARG MEDUSA_BACKEND_URL=http://localhost:9000
ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL
RUN pnpm --filter @dtc/backend build

# ── Runtime ───────────────────────────────────────────────────────────────
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@10.11.1 --activate && apk add --no-cache tini
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/backend/.medusa/server ./
RUN pnpm install --prod --ignore-workspace && pnpm store prune
COPY apps/backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 9000
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]
