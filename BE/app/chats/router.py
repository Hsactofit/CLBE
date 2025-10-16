from fastapi import APIRouter, Depends
from app.auth.service import get_user_state
from app.models import UserState

router = APIRouter()

# TODO: Add chat-related endpoints here
