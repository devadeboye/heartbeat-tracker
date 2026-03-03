import Kafka from 'node-rdkafka';

export interface MessageProcessor {
  /**
   * The topic this processor is responsible for.
   */
  topic: string;

  /**
   * Process a single message from the topic.
   */
  handle(message: Kafka.Message, flow: { pause: () => void; resume: () => void }): Promise<void>;

  /**
   * Called during application lifecycle to ensure necessary infrastructure (e.g. tables) exists.
   */
  setup(): Promise<void>;

  /**
   * Cleanly stop the processor (e.g. flush remaining batches).
   */
  stop(): Promise<void>;
}
