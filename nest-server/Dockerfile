# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apk add --no-libc-dev python3 make g++

# Copy package manifests and install dependencies
COPY package*.json ./
COPY libs/database/prisma/schema.prisma ./libs/database/prisma/

RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Build all monorepo microservices
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy package manifests & production node_modules
COPY package*.json ./
COPY libs/database/prisma/schema.prisma ./libs/database/prisma/

RUN npm ci --only=production && \
    npx prisma generate --schema=./libs/database/prisma/schema.prisma

# Copy compiled dist from builder
COPY --from=builder /usr/src/app/dist ./dist

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /usr/src/app

USER nestjs

EXPOSE 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 3011 3012 3013 3014 3015 3016

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/apps/api-gateway/main.js"]
