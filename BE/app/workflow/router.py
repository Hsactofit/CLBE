import os
from dotenv.main import logger
from fastapi import APIRouter, Depends, Query
from app.auth.service import get_project_state, get_user_state
from app.models import ProjectState, UserState
from app.schemas import WorkflowStepsPublic
from app.workflow import service as workflow_service


router = APIRouter()


@router.get("", response_model=WorkflowStepsPublic)
async def get_workflow_steps(project_state: ProjectState = Depends(get_project_state)):
    steps = await workflow_service.list_workflow_steps(
        db=project_state.db, project=project_state.project
    )
    return WorkflowStepsPublic(steps=steps)


@router.post("", response_model=WorkflowStepsPublic)
async def complete_workflow_step(
    workflow_step_key: str,
    project_state: ProjectState = Depends(get_project_state),
):
    steps = await workflow_service.complete_workflow_step(
        db=project_state.db,
        project=project_state.project,
        workflow_step_key=workflow_step_key,
    )
    return WorkflowStepsPublic(steps=steps)


@router.post("/evaluate", response_model=dict)
async def evaluate_workflow(
    project_state: ProjectState = Depends(get_project_state),
):
    """Manually trigger workflow evaluation (for testing/debugging)"""
    from app.workflow.workflow_evaluator import evaluate_workflow_completion

    result = await evaluate_workflow_completion(
        db=project_state.db,
        project=project_state.project
    )
    return result
