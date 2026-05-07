# ── Stage 1: install production dependencies ────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Placeholders so next build doesn't fail on static analysis of server modules.
# Actual values are injected at runtime via environment variables.
ENV DATABASE_URL=file:./dev.db
ENV NEXTAUTH_SECRET=placeholder-build-only
ENV TOTP_ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000
ENV TOTP_UNLOCK_SECRET=placeholder-build-only

RUN npm run build

# ── Stage 3: production runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
