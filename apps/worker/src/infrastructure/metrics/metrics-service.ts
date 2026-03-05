import express from 'express';
import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

export class MetricsService {
  private registry: Registry;
  private app: express.Application;
  
  // Custom metrics
  public readonly heartbeatsProcessed = new Counter({
    name: 'heartbeats_processed_total',
    help: 'Total number of heartbeats processed',
    labelNames: ['status'],
  });

  public readonly batchFlushDuration = new Histogram({
    name: 'heartbeat_batch_flush_duration_seconds',
    help: 'Duration of ClickHouse batch flushes',
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  });

  public readonly batchSize = new Gauge({
    name: 'heartbeat_current_batch_size',
    help: 'Current number of heartbeats waiting in memory',
  });

  constructor() {
    this.registry = new Registry();
    this.app = express();
    
    // Default metrics (CPU, Memory, etc)
    collectDefaultMetrics({ register: this.registry });
    
    // Register custom metrics
    this.registry.registerMetric(this.heartbeatsProcessed);
    this.registry.registerMetric(this.batchFlushDuration);
    this.registry.registerMetric(this.batchSize);

    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.get('/metrics', async (req, res) => {
      res.set('Content-Type', this.registry.contentType);
      res.end(await this.registry.metrics());
    });
  }

  public start(port: number = 9091) {
    this.app.listen(port, () => {
      console.log(`📊 Metrics server listening on port ${port}`);
    });
  }
}

export const metrics = new MetricsService();
