from fastapi import APIRouter, Depends
from app.auth.service import get_user_state
from app.models import UserState
from app.schemas import UserPublic

router = APIRouter()


@router.get("/me", response_model=UserPublic)
async def get_user(user_state: UserState = Depends(get_user_state)):
    """
    Get current user information from Clerk authentication
    """
    return user_state.user


# Separate auth router for health/ping style checks
auth_router = APIRouter()


@auth_router.get("/ping")
async def auth_ping(user_state: UserState = Depends(get_user_state)):
    """
    Simple auth check endpoint. Returns 200 if session is valid; 401 otherwise.
    """
    return {"ok": True}
