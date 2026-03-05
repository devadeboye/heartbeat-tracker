import { createClient } from '@clickhouse/client';
import { config } from '../../core/config.js';

export const clickhouse = createClient({
	url: config.CLICKHOUSE_URL,
	username: config.CLICKHOUSE_USER,
	password: config.CLICKHOUSE_PASSWORD,
	database: config.CLICKHOUSE_DATABASE,
});

export async function pingClickHouse(retries = 5, delayMs = 3000) {
	for (let i = 0; i < retries; i++) {
		try {
			await clickhouse.ping();
			console.log("ClickHouse connected.");
			return;
		} catch (err) {
			console.warn(
				`ClickHouse connection failed (attempt ${i + 1}/${retries}). Retrying in ${delayMs}ms...`,
			);
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}
	console.error("ClickHouse connection failed after maximum retries.");
	process.exit(1);
}
