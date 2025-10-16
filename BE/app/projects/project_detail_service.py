"""
Service layer for ProjectDetail operations
Handles saving and retrieving project-specific details like SOC codes and wage tiers
"""
import json
import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models import ProjectDetail, ProjectDetailType, Project

logger = logging.getLogger("uvicorn.error")


def save_project_detail(
    db: Session,
    project_id: int,
    detail_type: ProjectDetailType,
    value: str | dict
) -> ProjectDetail:
    """
    Save or update a project detail.

    Args:
        db: Database session
        project_id: ID of the project
        detail_type: Type of detail (SOC_CODE, WAGE_TIERS)
        value: Value to store (string or dict that will be JSON-encoded)

    Returns:
        ProjectDetail: The saved detail record
    """
    # Validate project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ValueError(f"Project with id {project_id} not found")

    # Convert dict to JSON string if needed
    if isinstance(value, dict):
        value_str = json.dumps(value)
    else:
        value_str = str(value)

    # Check if detail already exists
    existing = db.query(ProjectDetail).filter(
        ProjectDetail.project_id == project_id,
        ProjectDetail.type == detail_type.value
    ).first()

    if existing:
        # Update existing record
        logger.info(
            f"Updating existing {detail_type.value} for project {project_id}")
        existing.value = value_str
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new record
        logger.info(
            f"Creating new {detail_type.value} for project {project_id}")
        detail = ProjectDetail(
            project_id=project_id,
            type=detail_type.value,
            value=value_str
        )
        db.add(detail)
        try:
            db.commit()
            db.refresh(detail)
            return detail
        except IntegrityError as e:
            db.rollback()
            logger.error(f"Failed to save project detail: {e}")
            raise ValueError(f"Failed to save project detail: {e}")


def get_project_detail(
    db: Session,
    project_id: int,
    detail_type: ProjectDetailType,
    as_json: bool = False
) -> Optional[str | dict]:
    """
    Retrieve a project detail value.

    Args:
        db: Database session
        project_id: ID of the project
        detail_type: Type of detail to retrieve
        as_json: If True, parse JSON strings into dict objects

    Returns:
        The detail value as string, or parsed dict if as_json=True, or None if not found
    """
    detail = db.query(ProjectDetail).filter(
        ProjectDetail.project_id == project_id,
        ProjectDetail.type == detail_type.value
    ).first()

    if not detail:
        return None

    if as_json and detail_type == ProjectDetailType.WAGE_TIERS:
        try:
            return json.loads(detail.value)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON for {detail_type.value}: {e}")
            return detail.value

    return detail.value
