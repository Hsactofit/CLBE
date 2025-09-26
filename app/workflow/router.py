from fastapi import APIRouter, Depends, HTTPException, Query
from app.auth.service import get_project_state
from app.models import ProjectState
from app.schemas import WorkflowStepsPublic
from app.workflow import service as workflow_service
import uuid
import logging
from typing import Optional

logger = logging.getLogger("uvicorn.error")

router = APIRouter()


@router.get("/{project_public_id}/steps", response_model=WorkflowStepsPublic)
async def get_workflow_steps(
    project_public_id: uuid.UUID,
    project_state: ProjectState = Depends(get_project_state)
):
    """Get all workflow steps for a project"""
    try:
        steps = await workflow_service.get_workflow_steps(
            db=project_state.db,
            project=project_state.project
        )
        return WorkflowStepsPublic(steps=steps)
    except Exception as e:
        logger.error(f"Failed to retrieve workflow steps: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve workflow steps: {str(e)}"
        )


@router.post("/{project_public_id}/steps/evaluate", response_model=WorkflowStepsPublic)
async def evaluate_workflow_steps(
    project_public_id: uuid.UUID,
    step_key: Optional[str] = Query(
        None, description="Optional specific step to evaluate"),
    project_state: ProjectState = Depends(get_project_state)
):
    """
    Evaluate workflow steps and update completion status.

    Args:
        project_public_id: Project UUID
        step_key: Optional specific step to evaluate (e.g., 'information_collection')
                 If not provided, evaluates all incomplete steps
    """
    try:
        steps = await workflow_service.evaluate_workflow_steps(
            db=project_state.db,
            project=project_state.project,
            step_key=step_key
        )
        return WorkflowStepsPublic(steps=steps)
    except Exception as e:
        logger.error(f"Failed to evaluate workflow steps: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate workflow steps: {str(e)}"
        )
