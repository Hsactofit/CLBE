import os
import httpx
from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import HTTPException, status, Request, Depends
from sqlalchemy.orm import joinedload
from dotenv import load_dotenv
import logging
from app.database import db_dependency
from app.models import User, Client, UserState, ProjectState, Project, UserRole
import uuid
import datetime

logger = logging.getLogger("uvicorn.error")
load_dotenv()

clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))


def get_auth_user_id(request: Request) -> str:
    """
    If Clerk is enabled, return the Clerk user ID.
    If Clerk is disabled, return the test user ID.
    Clerk session token claims (JWT payload, i.e. request_state.payload):
    - sid (session ID): Unique identifier for the current session
    - sub (user ID): Unique identifier for the current user
    - azp (authorized party): The Origin header from the original Frontend API request, typically the application URL
    - exp (expiration time): Unix timestamp when the token expires, set by Token lifetime JWT template setting
    - fva (factor verification age): Minutes since last verification of first/second factors respectively
    - iat (issued at): Unix timestamp when the token was issued
    - iss (issuer): Frontend API URL of your Clerk instance (dev/prod)
    - nbf (not before): Unix timestamp before which token is invalid, set by Allowed Clock Skew setting
    """
    if os.getenv("CLERK_AUTH") == "False":
        # Get user info from request headers (highest priority)
        auth_user_id = request.headers.get("X-Test-User-ID")

        # Use default values as fallback
        auth_user_id = auth_user_id or "test_user_123"

        logger.info(
            f"[DEV MODE] Bypassing Clerk authentication for testing. Using test_user_id: {auth_user_id}"
        )
    else:
        # Transform FastAPI Request to httpx Request
        headers = dict(request.headers)
        method = request.method
        url = str(request.url)

        # Create httpx Request object
        httpx_request = httpx.Request(method, url, headers=headers)

        # Verify with Clerk SDK
        request_state = clerk.authenticate_request(
            httpx_request, AuthenticateRequestOptions()
        )

        # If authentication fails, raise HTTPException with status code 401
        if not request_state.is_signed_in:
            logger.error("request_state", request_state)
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

        # Return the payload of the request state
        auth_user_id = request_state.payload["sub"]
        logger.info(f"Authenticated Clerk user_ID: {auth_user_id}")

    return auth_user_id


async def get_user_state(request: Request, db: db_dependency) -> UserState:
    """
    Get user state from Clerk, return the payload of the request state
    If authentication fails, raise HTTPException with status code 401
    """

    try:
        auth_user_id = get_auth_user_id(request)

        # Get user in DB
        user = get_user(auth_user_id, db)

        if user.role == UserRole.CLIENT:
            client = get_client(user, db)
            userState = UserState(user=user, client=client, db=db)
        else:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "User is not a client")
            # TODO add other roles

        return userState

    except Exception as e:
        logger.error(f"Authentication failed: {str(e)}")
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, f"Authentication failed: {str(e)}"
        )


def get_user(auth_user_id: str, db: db_dependency) -> User:
    """
    Get or create user based on Clerk user_id
    """
    logger.info(f"=== GET_USER FUNCTION STARTED ===")
    logger.info(f"Looking for user with Clerk ID: {auth_user_id}")

    # Try to find existing user by external_id (Clerk user ID)
    user = db.query(User).filter(User.external_id == auth_user_id).first()
    logger.info(f"Database query result: {'User found' if user else 'User not found'}")

    if not user:
        # User doesn't exist - they need to create a client first
        logger.error(f"User not found for Clerk ID: {auth_user_id}")
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "User not found. Please create a client account first.",
        )
    else:
        logger.info(
            f"Existing user found: ID={user.id}, external_id={user.external_id}, role={user.role}"
        )

    # Update last_authenticated_at timestamp
    logger.info("Updating last_authenticated_at timestamp...")
    user.last_authenticated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    logger.info(f"Timestamp updated to: {user.last_authenticated_at}")

    logger.info(f"=== GET_USER FUNCTION COMPLETED ===")
    return user


def get_client(user: User, db: db_dependency) -> Client:
    if user.role != UserRole.CLIENT:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "User is not a client")

    client = db.query(Client).filter(Client.user_id == user.id).first()

    if not client:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")

    return client


async def get_project_state(
    project_public_id: uuid.UUID, user_state: UserState = Depends(get_user_state)
) -> ProjectState:
    """
    Get project with user validation
    """
    project = (
        user_state.db.query(Project)
        .filter(Project.public_id == project_public_id)
        .first()
    )

    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    if project.client_id != user_state.client.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "User does not have access to this project"
        )

    return ProjectState(
        project=project,
        user=user_state.user,
        client=user_state.client,
        db=user_state.db,
    )
