import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
	// Kafka
	KAFKA_BOOTSTRAP_SERVERS: z.string().default("localhost:19092"),
	KAFKA_CONSUMER_GROUP: z.string().default("heartbeat-worker-group"),
	KAFKA_TOPIC: z.string().default("heartbeats"),

	// ClickHouse
	CLICKHOUSE_URL: z.string().default("http://localhost:8123"),
	CLICKHOUSE_USER: z.string().default("default"),
	CLICKHOUSE_PASSWORD: z.string().default("password123"),
	CLICKHOUSE_DATABASE: z.string().default("default"),

	// Worker Settings
	BATCH_SIZE: z.coerce.number().default(1000),
	BATCH_TIMEOUT_MS: z.coerce.number().default(5000),
	LOG_LEVEL: z.string().default("info"),
});

const result = configSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment variables:', result.error.format());
  process.exit(1);
}

export const config = result.data;
