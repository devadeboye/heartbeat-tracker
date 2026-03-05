# Heartbeat Tracker

A high-performance pipeline designed to ingest, process, and analyze real-time device heartbeats at scale.

## The Architecture

This project is built as a distributed system to handle high-frequency data from millions of devices without sacrificing reliability or speed.

### Ingestion API (Python / FastAPI)

The entry point of the system. We chose FastAPI for its native support for asynchronous operations and its speed. Its sole responsibility is to receive heartbeats, validate them against our Protobuf schema, and hand them off to the message broker as quickly as possible.

### Messaging (Redpanda)

Redpanda serves as our streaming data platform. We used it instead of standard Kafka because it is simpler to manage and provides better performance on modern hardware. It acts as a buffer, ensuring the system can handle spikes in traffic without overwhelming the downstream database.

### Processing Worker (Node.js / TypeScript)

The worker is the bridge between our message bus and our database. It is written in Node.js to take advantage of its efficient event loop for I/O-heavy tasks. The worker performs heavy lifting: it consumes messages from multiple topics, handles backpressure, and batches writes to ClickHouse to optimize insertion speed.

### Storage (ClickHouse)

The final destination for all heartbeat data. ClickHouse is a columnar database designed for high-performance analytics. It allows us to store billions of rows and query them in milliseconds, making it ideal for tracking device health trends over time.

### Observability (Prometheus & Grafana)

We believe that you cannot manage what you cannot measure.

- Prometheus scrapes metrics from every part of the system globally.
- Grafana provides the visual interface to see those metrics.
- Redpanda Console allows for real-time inspection of the message topics for easier debugging.

## Getting Started

The entire stack is containerized for consistency across environments.

### Prerequisites

- Docker
- Docker Compose

### Startup

1. Pull the required images:

   ```bash
   docker compose pull
   ```

2. Build and start the services:

   ```bash
   docker compose up -d --build
   ```

### Access Points

- Ingestion API: localhost:8000
- Grafana: localhost:3000 (admin / admin)
- Prometheus: localhost:9090
- Redpanda Console: localhost:8080
