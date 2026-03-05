import Kafka from 'node-rdkafka';
import { clickhouse } from '../../../infrastructure/clickhouse/client.js';
import { config } from '../../../core/config.js';
import pkg from '../contracts/heartbeat.cjs';
import type { IHeartbeat } from '../contracts/heartbeat.js';
import type { MessageProcessor } from '../../../infrastructure/kafka/interfaces/processor.js';
import { metrics } from "../../../infrastructure/metrics/metrics-service.js";

// Define the shape of our ClickHouse row
interface HeartbeatRow {
  device_id: string;
  timestamp: string | number;
  battery_level: number;
  cpu_usage: number;
  firmware_version: string;
  latitude: number;
  longitude: number;
  processed_at: string;
}

const { Heartbeat } = pkg as unknown as { Heartbeat: typeof import('../contracts/heartbeat.js').Heartbeat };

export class HeartbeatProcessorService implements MessageProcessor {
  public topic = config.KAFKA_TOPIC;
  private batch: HeartbeatRow[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private flow: { pause: () => void; resume: () => void } | null = null;

  constructor() {}

  public handle = async (message: Kafka.Message, flow: { pause: () => void; resume: () => void }) => {
    this.flow = flow;
    if (!message.value) return;

    try {
      // 1. Deserialize Protobuf
      const decoded = Heartbeat.decode(message.value as Buffer);
      const data = Heartbeat.toObject(decoded, {
        longs: String,
        enums: String,
        bytes: String,
      }) as IHeartbeat;

      // 2. Flatten and map to ClickHouse schema (snake_case)
      this.batch.push({
        device_id: data.deviceId ?? 'unknown',
        timestamp: (data.timestamp as any) ?? Date.now(),
        battery_level: data.batteryLevel ?? 0,
        cpu_usage: data.cpuUsage ?? 0,
        firmware_version: data.firmwareVersion ?? '0.0.0',
        latitude: data.location?.latitude ?? 0,
        longitude: data.location?.longitude ?? 0,
        processed_at: new Date().toISOString().replace('T', ' ').slice(0, 23),
      });

      metrics.heartbeatsProcessed.inc({ status: "received" });
			metrics.batchSize.set(this.batch.length);

      // 3. Backpressure check
      if (this.batch.length >= config.BATCH_SIZE * 2) {
        console.warn('Batch size too large, pausing consumer...');
        this.flow.pause();
      }

      // 4. Trigger batch write if threshold met
      if (this.batch.length >= config.BATCH_SIZE) {
        await this.flush();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(this.flush, config.BATCH_TIMEOUT_MS);
      }
    } catch (err) {
      console.error('Error decoding heartbeat:', err);
    }
  }

  private flush = async () => {
    if (this.isProcessing || this.batch.length === 0) return;

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    this.isProcessing = true;
    const currentBatch = [...this.batch];
    this.batch = [];
    metrics.batchSize.set(0);

		const endTimer = metrics.batchFlushDuration.startTimer();

    try {
      console.log(`Flushing ${currentBatch.length} heartbeats to ClickHouse...`);
      
      await clickhouse.insert({
        table: 'heartbeats',
        values: currentBatch,
        format: 'JSONEachRow',
      });

      console.log('Batch flush successful.');
      
      // Resume if we were paused
      if (this.flow) {
        this.flow.resume();
      }
      metrics.heartbeatsProcessed.inc(
				{ status: "success" },
				currentBatch.length,
			);
    } catch (err) {
      metrics.heartbeatsProcessed.inc({ status: "error" }, currentBatch.length);
      console.error('Failed to flush batch to ClickHouse:', err);
      // TODO: retry or send to a DLQ
    } finally {
      endTimer();
      this.isProcessing = false;
      
      // If messages came in while processing, set timer again
      if (this.batch.length > 0 && !this.batchTimer) {
        this.batchTimer = setTimeout(this.flush, config.BATCH_TIMEOUT_MS);
      }
    }
  }

  public async setup() {
    await this.ensureTable();
    console.log('Heartbeat Processor ready.');
  }

  private async ensureTable() {
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS heartbeats (
          device_id String,
          timestamp UInt64,
          battery_level Float32,
          cpu_usage Float32,
          firmware_version String,
          latitude Float64,
          longitude Float64,
          processed_at DateTime64(3, 'UTC')
        ) ENGINE = ReplacingMergeTree
        ORDER BY (device_id, timestamp)
      `
    });
    console.log('ClickHouse table verified.');
  }

  public async stop() {
    console.log('Flushing remaining heartbeat batch before stop...');
    await this.flush();
  }
}
