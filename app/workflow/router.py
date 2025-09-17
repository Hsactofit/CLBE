from fastapi import APIRouter, Depends, Query
from app.auth.service import get_project_state, get_user_state
from app.models import ProjectState, UserState
from app.schemas import WorkflowStepsPublic
from app.workflow import service as workflow_service


router = APIRouter()


@router.get("", response_model=WorkflowStepsPublic)
async def get_workflow_steps(project_state: ProjectState = Depends(get_project_state)):
    steps = await workflow_service.list_workflow_steps(
        db=project_state.db, project_type_id=project_state.project.type_id
    )
    return WorkflowStepsPublic(steps=steps)
