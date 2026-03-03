import Kafka from 'node-rdkafka';
import { config } from '../../core/config.js';
import type { MessageProcessor } from './interfaces/processor.js';

export class ConsumerManager {
  private consumer: Kafka.KafkaConsumer;
  private processors = new Map<string, MessageProcessor>();

  constructor() {
    this.consumer = new Kafka.KafkaConsumer(
      {
        'bootstrap.servers': config.KAFKA_BOOTSTRAP_SERVERS,
        'group.id': config.KAFKA_CONSUMER_GROUP,
        'enable.auto.commit': false,
      },
      {
        'auto.offset.reset': 'earliest',
      }
    );

    this.setupEvents();
  }

  public registerProcessor(processor: MessageProcessor) {
    this.processors.set(processor.topic, processor);
  }

  private setupEvents() {
    this.consumer
      .on('ready', () => {
        const topics = Array.from(this.processors.keys());
        console.log(`Kafka Consumer ready. Subscribing to: ${topics.join(', ')}`);
        this.consumer.subscribe(topics);
        this.consumer.consume();
      })
      .on('data', async (data) => {
        const processor = this.processors.get(data.topic);
        if (!processor) {
          console.warn(`No processor registered for topic: ${data.topic}`);
          return;
        }

        try {
            await processor.handle(data, {
              pause: () => this.pause(),
              resume: () => this.resume(),
            });
            this.consumer.commitMessage(data);
          } catch (err) {
          console.error(`Error processing message from ${data.topic}:`, err);
        }
      })
      .on('event.error', (err) => {
        console.error('Kafka Consumer error:', err);
      });
  }

  public async start() {
    // Initialize all processors (e.g. ensure tables exist)
    for (const processor of this.processors.values()) {
      await processor.setup();
    }
    
    this.consumer.connect();
  }

  public async stop() {
    console.log('Stopping Consumer Manager...');
    
    // Stop all processors
    for (const processor of this.processors.values()) {
      await processor.stop();
    }
    
    this.consumer.disconnect();
  }

  // Backpressure methods
  public pause() {
    const assignments = this.consumer.assignments();
    this.consumer.pause(assignments);
  }

  public resume() {
    const assignments = this.consumer.assignments();
    this.consumer.resume(assignments);
  }
}
