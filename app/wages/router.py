from fastapi import APIRouter, Depends, Query, HTTPException
from app.auth.service import get_project_state
from app.models import ProjectState
import uuid
from app.schemas import WageTiersPublic
from app.wages import service as wage_service


router = APIRouter()


@router.get("/tiers", response_model=WageTiersPublic)
async def get_tiers(
    zip_code: str = Query(..., min_length=5, max_length=5),
    soc_code: str = Query(..., alias="soc_code"),
    project_state: ProjectState = Depends(get_project_state),
):
    """Get wage tiers by zip code and SOC code"""
    tiers = await wage_service.get_tiers_by_zip_and_soc(
        db=project_state.db, zip_code=zip_code, soc_code=soc_code
    )
    return WageTiersPublic(tiers=tiers)


@router.get("/", response_model=WageTiersPublic)
async def test_wages(
    project_state: ProjectState = Depends(get_project_state),
):
    """Get wage tiers from current project state"""
    tiers = await wage_service.get_tiers_from_current_project_state(
        db=project_state.db, project=project_state.project
    )
    return WageTiersPublic(tiers=tiers)
