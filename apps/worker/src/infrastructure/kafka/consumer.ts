import Kafka from 'node-rdkafka';
import { config } from '../../core/config.js';

export class KafkaConsumer {
  private consumer: Kafka.KafkaConsumer;

  constructor(
    private topic: string,
    private onMessage: (message: Kafka.Message) => Promise<void>,
    private onRebalance?: (err: any, assignments: any) => void
  ) {
    this.consumer = new Kafka.KafkaConsumer(
      {
        'bootstrap.servers': config.KAFKA_BOOTSTRAP_SERVERS,
        'group.id': config.KAFKA_CONSUMER_GROUP,
        'enable.auto.commit': false, // Manual commit for better control
      },
      {
        'auto.offset.reset': 'earliest',
      }
    );

    this.setupEvents();
  }

  private setupEvents() {
    this.consumer
      .on('ready', () => {
        console.log('Kafka Consumer ready.');
        this.consumer.subscribe([this.topic]);
        this.consumer.consume();
      })
      .on('data', async (data) => {
        try {
          await this.onMessage(data);
          this.consumer.commitMessage(data); // Commit after successful processing
        } catch (err) {
          console.error('Error processing message:', err);
          // TODO: pause and retry or send to a DLQ
        }
      })
      .on('event.error', (err) => {
        console.error('Kafka Consumer error:', err);
      });

    if (this.onRebalance) {
      this.consumer.on('rebalance', this.onRebalance);
    }
  }

  public connect() {
    this.consumer.connect();
  }

  public disconnect() {
    this.consumer.disconnect();
  }

  public pause() {
    const assignments = this.consumer.assignments();
    this.consumer.pause(assignments);
  }

  public resume() {
    const assignments = this.consumer.assignments();
    this.consumer.resume(assignments);
  }
}
