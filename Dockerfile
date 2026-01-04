# Use Node 20 Debian slim for better compatibility with native modules
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install runtime dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Copy vendor directory (includes prebuilt bloxy)
COPY --from=builder /app/vendor ./vendor

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma schema and generate client
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy resources directory if it exists
COPY --from=builder /app/src/resources ./src/resources

# Copy database directory for SQLite
COPY --from=builder /app/src/database ./src/database

# Expose port (optional, Railway will assign its own)
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
