# Stage 1: Build dependencies
FROM python:3.10-slim as builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    liblz4-dev \
    && rm -rf /var/lib/apt/lists/*

COPY apps/ingestion-api/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Final image
FROM python:3.10-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    liblz4-1 \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/home/appuser/.local/bin:$PATH" \
    PYTHONPATH="/app:$PYTHONPATH"

WORKDIR /app

# Create a non-root user
RUN groupadd -r appuser && useradd -r -m -d /home/appuser -g appuser appuser || true

# Copy installed dependencies from the builder stage
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local

# Copy application source code
COPY --chown=appuser:appuser apps/ingestion-api/app /app/app

# Copy shared proto
COPY --chown=appuser:appuser libs/contracts /libs/contracts

# Ensure correct permissions
RUN chown -R appuser:appuser /app && chmod -R 755 /app

# Switch to the non-root user
USER appuser

# Generate Python Protobuf files using the system python (which has access to ~/.local packages)
RUN python -m grpc_tools.protoc -I/libs/contracts --python_out=/app/app/domains/heartbeat/contracts/ /libs/contracts/heartbeat.proto

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
