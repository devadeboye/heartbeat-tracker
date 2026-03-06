# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /build

# Build tools for node-rdkafka
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libsasl2-dev \
    libzstd-dev \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

COPY apps/worker/package*.json ./
RUN npm install --legacy-peer-deps

# Copy shared proto
COPY libs/contracts /libs/contracts

# Copy application source
COPY apps/worker .

# Generate Protobuf contracts
RUN mkdir -p src/domains/heartbeat/contracts && \
    npx pbjs -t static-module -w es6 -o src/domains/heartbeat/contracts/heartbeat.js /libs/contracts/heartbeat.proto && \
    npx pbts -o src/domains/heartbeat/contracts/heartbeat.d.ts src/domains/heartbeat/contracts/heartbeat.js && \
    mv src/domains/heartbeat/contracts/heartbeat.js src/domains/heartbeat/contracts/heartbeat.cjs

RUN npx tsc

# Stage 2: Runtime
FROM node:22-slim AS runtime

WORKDIR /app

# Minimal runtime dependencies for node-rdkafka
RUN apt-get update && apt-get install -y \
    libsasl2-2 \
    libzstd1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./package.json

# Default environment
ENV NODE_ENV=production
ENV KAFKA_BOOTSTRAP_SERVERS=redpanda:9092
ENV CLICKHOUSE_URL=http://clickhouse:8123

CMD ["node", "dist/main.js"]
