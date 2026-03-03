# Heartbeat Ingestion API (FastAPI)

A high-performance FastAPI service designed for ingesting 100k+ RPS of Protobuf-serialized heartbeat telemetry.

## Features

- **Asynchronous Only**: Built with `uvloop` and `aiokafka`.
- **Protobuf Native**: Optimized binary ingestion path.
- **Strict Versioning**: Global `/api/v1` structure.
- **Reliability**: Idempotent producer with persistent lifespan management.
- **Observability**: Prometheus metrics and structured logging.

## Getting Started

### Prerequisites

- Python 3.10+
- `protoc` installed (for schema generation)
- Redpanda (Kafka) running

### Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Generate Protobuf code
make proto-gen

# Run locally
uvicorn app.main:app --reload
```

## API Design

### POST `/api/v1/heartbeat/ingest`

- **Content-Type**: `application/x-protobuf`
- **Response**: `202 Accepted`

### GET `/api/v1/system/health`

- **Response**: `200 OK`

## Architecture (DDD / Modular)

Following **Domain-Driven Design (DDD)** and **Vertical Slicing** patterns to ensure scalability and high encapsulation.

- **`app/domains/`**: Vertical slices containing the core logic, API routes, and domain services for each feature.
  - `heartbeat/`: Protobuf parsing, domain validation, and routing to infrastructure.
  - `system/`: Operational routes like health checks.
- **`app/infrastructure/`**: Low-level technical implementations that our domains depend on (e.g., Kafka, DBs).
- **`app/core/`**: Cross-cutting concerns like global configuration (`BaseSettings`) and logging.
- **`app/schemas/`**: Shared data contracts (Protobuf generated code).
- **`app/main.py` & `app/router.py`**: The "Application Root" and "Main Module" equivalents that wire up the domains and infrastructure lifecycles.

## Schema (Protobuf)

The schema is defined in `libs/contracts/heartbeat.proto` and compiled into `app/schemas/protobuf`.
