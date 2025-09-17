from fastapi import APIRouter, Depends
from app.auth.service import get_user_state, get_project_state

from app.models import UserState, ProjectState
from app.schemas import (
    ProjectCreate,
    ProjectTypesPublic,
    ProjectsPublic,
    ProjectPublic,
)
from app.projects import service as project_service
from fastapi import HTTPException

import logging

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("", response_model=ProjectsPublic)
async def list_projects(user_state: UserState = Depends(get_user_state)):
    """Get all projects for a client"""
    try:
        logger.info(f"Getting all projects for client: {user_state.client.public_id}")
        return ProjectsPublic(projects=user_state.client.projects)
    except Exception as e:
        logger.error(f"Failed to retrieve projects: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve projects: {str(e)}"
        )


@router.post("", response_model=ProjectPublic)
async def create_project(
    payload: ProjectCreate,
    user_state: UserState = Depends(get_user_state),
):
    """Create a new project"""
    try:
        project = await project_service.create(
            db=user_state.db, client_id=user_state.client.id, project_data=payload
        )
        return project
    except ValueError as e:
        logger.error(f"Project creation failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Project creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")


@router.delete("/{project_public_id}", response_model=dict)
async def delete_project(
    project_state: ProjectState = Depends(get_project_state),
):
    """Delete a project"""
    try:
        result = await project_service.delete(
            db=project_state.db, project=project_state.project
        )
        return result
    except ValueError as e:
        logger.error(f"Project deletion failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Project deletion failed: {e}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")


@router.get("/types", response_model=ProjectTypesPublic)
async def get_project_types(user_state: UserState = Depends(get_user_state)):
    db = user_state.db
    types = await project_service.list_types(db=db)
    return ProjectTypesPublic(types=types)


# workflow steps moved to app/workflow_steps
