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

## Performance & Load Testing

A local benchmark was performed using **Apache Bench** (`ab`) to simulate high traffic against the Ingestion API.

### Test Configuration

- **Payload**: 67-byte binary Protobuf encoded heartbeat.
- **Concurrency**: 100 concurrent clients.
- **Total Requests**: 10,000.

### Results (Single Worker)

The system successfully absorbed the traffic without dropping a single message, buffering the spikes perfectly in Redpanda for the Node.js worker to batch process.

- **Complete requests**: 10,000
- **Failed requests**: 0
- **Requests per second**: ~330 [#/sec] (Mean)
- **Time per request**: ~302ms (across all concurrent requests)

### Results (Multi-Worker - Localized via Docker Desktop)

A secondary test was run using 4 Uvicorn workers to test horizontal scaling.

- **Complete requests**: 10,000
- **Failed requests**: 0
- **Requests per second**: ~123 [#/sec] (Mean)

*Note on Local Performance:* Running multiple Uvicorn worker processes inside Docker Desktop on macOS often results in *lower* throughput than a single async worker due to the virtualization overhead and context-switching across the hypervisor bridge. In a native Linux production environment, the multi-worker setup would yield a proportional increase in requests per second.

### Results (Cloud Scale - AWS EC2 t3.large)

To demonstrate true throughput, the stack was provisioned on a native Linux AWS EC2 instance (`t3.large`) using Terraform, unleashing the multi-worker Ingestion API without hypervisor bottlenecks.

- **Complete requests**: 100,000
- **Failed requests**: 0
- **Requests per second**: ~823 [#/sec] (Mean)
- **Time per request**: ~1.2ms (across all concurrent requests)

The Node.js worker efficiently batched all messages from these tests and flushed them to ClickHouse, keeping the system completely stable under heavy load.

---

### Load Test Evidence

The following captures provide proof of the system's performance and stability during the live AWS cloud benchmark:

*Note: These screenshots capture the Redpanda console, the active AWS EC2 instance, and the Apache Bench terminal output.*

- ![Benchmark Evidence 1](docs/benchmarks/Screenshot%202026-03-06%20at%2009.47.43.png)
- ![Benchmark Evidence 2](docs/benchmarks/Screenshot%202026-03-06%20at%2009.47.57.png)
- ![Benchmark Evidence 3](docs/benchmarks/Screenshot%202026-03-06%20at%2009.48.31.png)
- ![Benchmark Evidence 4](docs/benchmarks/Screenshot%202026-03-06%20at%2009.52.37.png)
