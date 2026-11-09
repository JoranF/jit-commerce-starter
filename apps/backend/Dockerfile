# ── Build ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install --immutable
COPY . .
# De admin-UI wordt tijdens de build gebundeld en moet weten waar de API draait.
ARG MEDUSA_BACKEND_URL=http://localhost:9000
ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL
RUN yarn build

# ── Runtime ───────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
RUN corepack enable && apk add --no-cache tini
ENV NODE_ENV=production
COPY --from=build /app/.medusa/server ./
COPY --from=build /app/.yarnrc.yml ./
COPY --from=build /app/.yarn ./.yarn
RUN yarn workspaces focus --production && yarn cache clean --all || true
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 9000
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]
