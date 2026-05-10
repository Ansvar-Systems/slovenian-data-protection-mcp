# ─────────────────────────────────────────────────────────────────────────────
# Slovenian Data Protection MCP — multi-stage Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# Build:  docker build -t slovenian-data-protection-mcp .
# Run:    docker run --rm -p 3000:3000 slovenian-data-protection-mcp
#
# The image expects a pre-built database at /app/data/iprs.db.
# Override with IPRS_DB_PATH for a custom location.
#
# Multi-stage build: stage 1 builds TypeScript + native modules
# (better-sqlite3 postinstall), stage 2 copies node_modules from
# stage 1 to preserve the native binding. This avoids the
# `Could not locate the bindings file` regression that happened
# when stage 2 re-ran `npm ci --ignore-scripts` (sector-binding
# regression 2026-05-09).
# ─────────────────────────────────────────────────────────────────────────────

# --- Stage 1: Build TypeScript + native modules ---
FROM node:20-slim AS builder

WORKDIR /app

# Install build tooling needed for better-sqlite3 native compile
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
# Run full install (no --ignore-scripts) so better-sqlite3 postinstall
# fetches/builds the native .node binding into node_modules.
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

# Prune to production deps only (preserves the already-built native binding).
RUN npm prune --omit=dev

# --- Stage 2: Production ---
FROM node:20-slim AS production

WORKDIR /app
ENV NODE_ENV=production
ENV IPRS_DB_PATH=/app/data/iprs.db

# Copy production node_modules (with native binding intact) and built dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Database baked into the image at build time.
# CI provisions this from the GitHub Release as data/database.db, so the
# COPY source is database.db; the destination keeps the canonical filename
# the application code expects (iprs.db).
COPY data/database.db data/iprs.db

# Non-root user for security
RUN addgroup --system --gid 1001 mcp && \
    adduser --system --uid 1001 --ingroup mcp mcp && \
    chown -R mcp:mcp /app
USER mcp

# Health check: verify HTTP server responds
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "dist/src/http-server.js"]
