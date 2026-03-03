from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Config
    PROJECT_NAME: str = "Heartbeat Ingestion API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Kafka Config
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:19092"
    KAFKA_TOPIC: str = "heartbeats"
    KAFKA_CLIENT_ID: str = "ingestion-api"
    
    # Logging
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env", 
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
