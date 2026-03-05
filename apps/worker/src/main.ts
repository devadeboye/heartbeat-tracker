import { ConsumerManager } from './infrastructure/kafka/consumer-manager.js';
import { HeartbeatProcessorService } from './domains/heartbeat/services/heartbeat-processor.js';
import { metrics } from "./infrastructure/metrics/metrics-service.js";
import { pingClickHouse } from './infrastructure/clickhouse/client.js';

async function main() {
	// 0. Start Metrics Server
	metrics.start();

	// 1. Connectivity Check
	await pingClickHouse();

	// 2. Initialize orchestration
	const manager = new ConsumerManager();
	const heartbeatProcessor = new HeartbeatProcessorService();

	manager.registerProcessor(heartbeatProcessor);

	// 3. Start everything
	await manager.start();

	// 4. Graceful Shutdown
	const shutdown = async () => {
		console.log("Shutting down worker...");
		await manager.stop();
		process.exit(0);
	};

	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
