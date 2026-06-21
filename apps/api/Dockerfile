# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package.json, lockfile, and workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy package.json for workspaces
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install pnpm
RUN npm install -g pnpm@9

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Build api
RUN pnpm --filter @casa-corona/api build
RUN pnpm --filter @casa-corona/db build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy root package.json, lockfile, and workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy package.json for workspaces
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install pnpm and production dependencies only
RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/src/schema ./packages/db/src/schema
COPY --from=builder /app/packages/db/src/index.ts ./packages/db/src/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Set non-root user
USER node

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/healthz || exit 1

# Start the app
CMD ["node", "apps/api/dist/index.js"]
