from app.database import db_dependency
from app.models import User, Client
from app.schemas import ClientCreate
from fastapi import HTTPException, status
import logging


logger = logging.getLogger("uvicorn.error")


async def create_client_user(
    clerk_user_id: str, client_data: ClientCreate, db: db_dependency
) -> Client:
    """
    Create a new user and client based on Clerk user ID and client data
    Returns Client object
    """

    try:
        # Check if user already exists
        user = db.query(User).filter(User.external_id == clerk_user_id).first()
        logger.info(f"Checking for existing user with external_id: {clerk_user_id}")

        if user:
            logger.error(f"User already exists: {user.public_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
            )

        # Create the user first with email
        user = User(
            external_id=clerk_user_id, role="CLIENT", email=client_data.user_email
        )
        db.add(user)
        db.flush()  # Flush to get the ID without committing

        if not client_data.client_name:
            logger.error(f"No client name provided for user: {clerk_user_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No client name provided",
            )

        # Create the client with the user relationship
        client = Client(
            name=client_data.client_name,
            user_id=user.id,
            trade_name=client_data.trade_name,
            first_name=client_data.first_name,
            last_name=client_data.last_name,
            address=client_data.address,
            address2=client_data.address2 if client_data.address2 else None,
            city=client_data.city,
            state=client_data.state,
            zip=client_data.zip if client_data.zip else None,
            telephone=client_data.telephone if client_data.telephone else None,
            naics_code=client_data.naics_code if client_data.naics_code else None,
            fein=client_data.fein if client_data.fein else None,
        )

        db.add(client)
        db.commit()

        db.refresh(user)
        db.refresh(client)
        return client

    except HTTPException:
        logger.error("HTTPException occurred in create_client_user")
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error creating client user: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Exception details: {e}")
        raise
