FROM node:22-bookworm-slim AS base

FROM base AS deps
WORKDIR /app
# Install build tools for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create directories for DB and PPTX cache
RUN mkdir -p /data/cache/pptx

# Copy public directory and Next.js static files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Ensure data folder is available for hymnal seed at runtime
COPY --from=builder /app/data ./data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# We run as root by default to avoid permission issues when bind mounting 
# Windows host directories to /data via Docker Desktop WSL2.
CMD ["node", "server.js"]
