import logging
from typing import Optional
from aiokafka import AIOKafkaProducer
from app.core.config import settings

logger = logging.getLogger(__name__)

class KafkaProducerService:
    def __init__(self):
        self._producer: Optional[AIOKafkaProducer] = None

    async def start(self) -> None:
        """Initialize the Kafka producer on application startup."""
        if self._producer:
            return

        logger.info(f"Initializing Kafka producer connecting to {settings.KAFKA_BOOTSTRAP_SERVERS}")
        self._producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            client_id=settings.KAFKA_CLIENT_ID,
            # Performance tuning for high-throughput
            acks="all", 
            enable_idempotence=True,
            # compression_type="lz4",
            linger_ms=10,
            max_batch_size=16384 * 4,
            max_request_size=1048576,
            retry_backoff_ms=500,
        )
        await self._producer.start()
        logger.info("Kafka producer started successfully.")

    async def stop(self) -> None:
        """Cleanly close the Kafka producer on application shutdown."""
        if self._producer:
            logger.info("Stopping Kafka producer...")
            await self._producer.stop()
            self._producer = None
            logger.info("Kafka producer stopped.")

    async def send(self, topic: str, value: bytes, key: Optional[bytes] = None) -> None:
        """Non-blocking buffering and sending to Kafka."""
        if not self._producer:
            raise RuntimeError("Kafka producer is not initialized.")
        
        try:
            await self._producer.send(topic, value, key=key)
        except Exception as e:
            logger.error(f"Failed to buffer message for Kafka: {e}")
            raise

# Global Instance
producer_service = KafkaProducerService()
