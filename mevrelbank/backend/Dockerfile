# Build context is the REPO ROOT (Render sets this when rootDir is not used).
# All COPY paths below are relative to the repo root.

FROM node:20-alpine AS deps
WORKDIR /app

COPY mevrelbank/backend/.npmrc mevrelbank/backend/package.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S mevrel && adduser -S mevrel -G mevrel

COPY --from=deps /app/node_modules ./node_modules
COPY mevrelbank/backend/ .

RUN chown -R mevrel:mevrel /app
USER mevrel

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "server.js"]
