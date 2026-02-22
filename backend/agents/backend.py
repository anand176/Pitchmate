"""
Agents router — Pitchmate AI co-pilot endpoint.
"""

from typing import Optional, Annotated
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
import logging

from auth.dependencies import get_current_user

logger = logging.getLogger("agents_backend")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/agents", tags=["Agents"])


class PitchmateRequest(BaseModel):
    query: str
    session_id: Optional[str] = None


class PitchmateResponse(BaseModel):
    status: str
    response: str
    session_id: str


@router.post("/pitchmate", response_model=PitchmateResponse)
async def pitchmate(
    req: PitchmateRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """
    Main Pitchmate agent endpoint.
    Accepts a natural language query and streams it through the orchestrator agent.
    The user_id is derived from the authenticated JWT.
    """
    user_id = current_user["id"]
    logger.info(f"Pitchmate request: user={user_id}, query={req.query[:80]}...")

    try:
        from agents.agent_runner import handle_agent_request
        from agents.agent import pitchmate_agent

        response, actual_session_id = await handle_agent_request(
            user_id=user_id,
            query=req.query,
            agent=pitchmate_agent,
            app_name="pitchmate_app",
            session_id=req.session_id,
        )

        return PitchmateResponse(
            status="success",
            response=response,
            session_id=actual_session_id,
        )

    except Exception as e:
        logger.error(f"Pitchmate agent error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process request: {str(e)}",
        )
