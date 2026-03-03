import logging
from typing import Optional
from app.infrastructure.kafka.producer import producer_service
from app.core.config import settings
from app.domains.heartbeat.contracts.heartbeat_pb2 import Heartbeat as PB_Heartbeat

logger = logging.getLogger(__name__)

class HeartbeatService:
    @staticmethod
    async def process_binary_heartbeat(body: bytes) -> str:
        """
        Domain logic: Parses, validates, and routes the binary heartbeat.
        Returns the device_id for status tracking.
        """
        # 1. Parse/Validate schema
        heartbeat = PB_Heartbeat()
        try:
            heartbeat.ParseFromString(body)
        except Exception as e:
            logger.warning(f"Failed to parse Protobuf payload: {e}")
            raise ValueError(f"Invalid payload format: {e}")

        # 2. Basic Domain Validation
        if not heartbeat.device_id:
            logger.error("Heartbeat received without device_id")
            raise ValueError("Missing device_id in heartbeat")

        # 3. Route to Infrastructure layer (Non-blocking)
        # Using device_id as partitioning key for Exactly-Once Semantics (EOS) 
        # or ordering per device.
        await producer_service.send(
            topic=settings.KAFKA_TOPIC,
            value=body, 
            key=heartbeat.device_id.encode()
        )

        return heartbeat.device_id

# Instantiate the service singleton
heartbeat_service = HeartbeatService()
