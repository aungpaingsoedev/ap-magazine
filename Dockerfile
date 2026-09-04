FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public URLs baked into the client bundle
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG BETTER_AUTH_URL=http://localhost:3000
# Required at build time (Better Auth rejects missing/default secret)
ARG BETTER_AUTH_SECRET=docker-build-only-change-me-in-runtime-env-32c

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV GOOGLE_CLIENT_ID=build-placeholder
ENV GOOGLE_CLIENT_SECRET=build-placeholder
# Ephemeral SQLite so Next can prerender pages that query the DB
ENV DATABASE_URL=/tmp/cms-build.db
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npx drizzle-kit push \
  && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=./data/cms.db

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/next.config.ts ./
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
  && mkdir -p /app/data /app/uploads

EXPOSE 3000
VOLUME ["/app/data", "/app/uploads"]
ENTRYPOINT ["/entrypoint.sh"]
