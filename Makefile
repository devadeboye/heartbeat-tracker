# High-Throughput Event Platform Makefile

.PHONY: proto-gen run-ingestion-api test

# --- [ Protobuf Management ] ---
PROTO_SRC=libs/contracts/heartbeat.proto
INGESTION_PB_OUT=apps/ingestion-api/app/domains/heartbeat/contracts
WORKER_PB_OUT=apps/worker/src/domains/heartbeat/contracts

proto-gen:
	@echo "Generating Python Protobuf code..."
	protoc --proto_path=libs/contracts --python_out=${INGESTION_PB_OUT} ${PROTO_SRC}
	touch ${INGESTION_PB_OUT}/__init__.py
	@echo "Done."

proto-gen-ts:
	@echo "Generating TypeScript Protobuf code..."
	cd apps/worker && npx pbjs -t static-module -w commonjs -o src/domains/heartbeat/contracts/heartbeat.js ../../libs/contracts/heartbeat.proto
	cd apps/worker && npx pbts -o src/domains/heartbeat/contracts/heartbeat.d.ts src/domains/heartbeat/contracts/heartbeat.js
	mv apps/worker/src/domains/heartbeat/contracts/heartbeat.js apps/worker/src/domains/heartbeat/contracts/heartbeat.cjs
	@echo "Done."

# --- [ Application Management ] ---
install-deps:
	pip install -r apps/ingestion-api/requirements.txt

run-ingestion-api:
	cd apps/ingestion-api && \
	export PYTHONPATH=$$(pwd):$$PYTHONPATH && \
	uvicorn app.main:app --reload --port 8000

# --- [ Docker & Infrastructure ] ---
up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f
