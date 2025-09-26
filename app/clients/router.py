from fastapi import APIRouter, HTTPException, status
from app.clients.service import create_client_user
from app.models import User
from app.schemas import ClientCreate, ClientCreateRequest, ClientCreateResponse
from app.database import db_dependency
import logging
import os
from clerk_backend_api import Clerk

router = APIRouter()

# Set up logging
logger = logging.getLogger("uvicorn.error")

clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))


@router.post("", response_model=ClientCreateResponse)
async def create_client(
    payload: ClientCreateRequest, db: db_dependency
) -> ClientCreateResponse:
    """
    Create a new client - requires Clerk user ID in request body
    Creates user and client in database using existing functions

    Request body:
    - clerk_user_id: Clerk user ID (required)
    - client_name: Name for the client (required)
    - trade_name: Client trade name (optional)
    - first_name: Client first name (required)
    - last_name: Client last name (required)
    - address: Client address (required)
    - address2: Client address2 (optional)
    - city: Client city (required)
    - state: Client state (required)
    - zip: Client zip (required)
    - telephone: Client telephone (required)
    - naics_code: Client NAICS code (required)
    - fein: Client FEIN (required)
    - email: User's email address (required, will be stored in user record)
    """

    try:
        clerk_user_id = payload.clerk_user_id

        # Map request to service DTO
        client_data = ClientCreate(
            client_name=payload.client_name,
            user_email=payload.email,
            trade_name=payload.trade_name,
            first_name=payload.first_name,
            last_name=payload.last_name,
            address=payload.address,
            address2=payload.address2,
            city=payload.city,
            state=payload.state,
            zip=payload.zip,
            telephone=payload.telephone,
            naics_code=payload.naics_code,
            fein=payload.fein,
        )

        # Use service function to create user and client
        client = await create_client_user(clerk_user_id, client_data, db)

        # Get the user that was created
        user = db.query(User).filter(User.external_id == clerk_user_id).first()

        if not user:
            logger.error("User creation failed - user not found after client creation")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User creation failed",
            )

        # Return response with both client and user information
        return ClientCreateResponse(
            client_public_id=client.public_id,
            client_name=client.name,
            trade_name=client.trade_name,
            first_name=client.first_name,
            last_name=client.last_name,
            address=client.address,
            address2=client.address2,
            city=client.city,
            state=client.state,
            zip=client.zip,
            telephone=client.telephone,
            naics_code=client.naics_code,
            fein=client.fein,
            user_email=user.email,
            user_public_id=user.public_id,
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        logger.error("HTTPException occurred in client creation")
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing client creation request: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Exception details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )
