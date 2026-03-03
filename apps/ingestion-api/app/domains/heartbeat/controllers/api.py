import logging
from fastapi import APIRouter, Request, HTTPException, status
from app.domains.heartbeat.services.heartbeat_service import heartbeat_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED)
async def ingest_heartbeat(request: Request):
    """
    HTTP Entry point for the Heartbeat domain.
    Delegates validation and processing to the Domain Service.
    """
    body = await request.body()
    if not body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty request body")

    try:
        device_id = await heartbeat_service.process_binary_heartbeat(body)
        return {"status": "accepted", "device_id": device_id}

    except ValueError as e:
        logger.warning(f"Domain Validation Failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Internal System Error during ingestion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Ingestion service error"
        )
