# ================================
# Stage 1 — Install dependencies
# ================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files only first
# This caches npm install layer
COPY package*.json ./

# Install all dependencies including dev
RUN npm ci

# ================================
# Stage 2 — Build / Generate Prisma
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from stage 1
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# ================================
# Stage 3 — Production image
# ================================
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma schema and generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

# Copy source code
COPY src ./src

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

CMD ["node", "src/index.js"]