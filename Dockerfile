FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ui/package.json ./packages/ui/package.json

RUN NODE_ENV=development npm ci --include=dev

FROM deps AS builder

WORKDIR /app

COPY . .

ENV NODE_ENV=production
RUN npm run build --workspace apps/web

FROM builder AS pruner

RUN npm prune --omit=dev

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=pruner /app/package.json ./package.json
COPY --from=pruner /app/apps/web/package.json ./apps/web/package.json
COPY --from=pruner /app/node_modules ./node_modules
COPY --from=pruner /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/dist ./apps/web/dist

RUN mkdir -p /app/storage

EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null || exit 1

CMD ["node", "./apps/web/dist/server/entry.mjs"]
