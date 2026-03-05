import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.router import api_router
from app.core.config import settings
from app.infrastructure.kafka.producer import producer_service
from prometheus_fastapi_instrumentator import Instrumentator

# Logging Setup (Simplified for DDD example)
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Bootstrap the infrastructure (Kafka, DBs) during app lifecycle.
    """
    try:
        await producer_service.start()
    except Exception as e:
        logger.error(f"Failed to initialize infrastructure: {e}")
        # In production, you might not want to start the API if infrastructure is down
        # raise SystemExit(1)
        
    yield
    
    await producer_service.stop()

def create_app() -> FastAPI:
    """Instantiate and configure the FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url="/openapi.json",
        lifespan=lifespan
    )

    # Core Router Registration
    app.include_router(api_router)

    # Expose Prometheus metrics on /metrics
    Instrumentator().instrument(app).expose(app)

    return app

app = create_app()
