FROM node:20-alpine AS deps
WORKDIR /app

COPY .npmrc package.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S mevrel && adduser -S mevrel -G mevrel

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN chown -R mevrel:mevrel /app
USER mevrel

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "server.js"]
