# Build stage
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and type definitions
RUN npm install

# Copy source code
COPY . .

# Build TypeScript and verify the build
RUN npm run build && \
    ls -la dist/

# Production stage for API
FROM --platform=$TARGETPLATFORM node:20-alpine AS api

WORKDIR /app

# Copy package files and install ALL dependencies
COPY package*.json ./
RUN npm install

# Copy built files from builder and verify
COPY --from=builder /app/dist ./dist
RUN ls -la dist/

# Expose port
EXPOSE 3000

# Start API
CMD ["node", "dist/index.js"] 