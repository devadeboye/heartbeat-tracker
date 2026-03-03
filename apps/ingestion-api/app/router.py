from fastapi import APIRouter
from app.domains.heartbeat.controllers.api import router as heartbeat_router
from app.domains.system.api import router as system_router
from app.core.config import settings

api_router = APIRouter()

# Registering Domains (Vertical Slices) under v1
api_router.include_router(
    heartbeat_router, prefix=f"{settings.API_V1_STR}/heartbeat", tags=["heartbeat"]
)
api_router.include_router(
    system_router, prefix=f"{settings.API_V1_STR}/system", tags=["system"]
)
