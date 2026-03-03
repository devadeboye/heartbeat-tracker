import { createClient } from '@clickhouse/client';
import { config } from '../../core/config.js';

export const clickhouse = createClient({
  host: config.CLICKHOUSE_HOST,
  username: config.CLICKHOUSE_USER,
  password: config.CLICKHOUSE_PASSWORD,
  database: config.CLICKHOUSE_DATABASE,
});

export async function pingClickHouse() {
  try {
    await clickhouse.ping();
    console.log('ClickHouse connected.');
  } catch (err) {
    console.error('ClickHouse connection failed:', err);
    process.exit(1);
  }
}
