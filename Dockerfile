# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# -----------------------------------------------------------------------------
# Stage 2: Build (with placeholder env so Next inlines md5 placeholders)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Set .env to KEY=md5(KEY) so build bakes placeholders into .next output
RUN node scripts/set_dummy_env.js
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production image (runtime env injected on container start)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
EXPOSE 3000

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy env template and runtime scripts (replace placeholders with real env at start)
COPY .env.example ./
COPY scripts/build_and_run.sh scripts/search_and_replace_env.js ./scripts/
RUN chmod +x ./scripts/build_and_run.sh

ENTRYPOINT ["/bin/sh", "/app/scripts/build_and_run.sh"]
