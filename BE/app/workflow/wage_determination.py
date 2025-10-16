"""
Wage Determination Service for H-1B Projects
Handles SOC code classification and wage tier lookups with database caching
"""

import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models import ProjectDetailType, WageAreaJob, WageJob, WageZipArea
from app.projects.project_detail_service import save_project_detail, get_project_detail

logger = logging.getLogger("uvicorn.error")


async def process_wage_determination(
    db: Session,
    project_id: int,
    job_description: str,
    zipcode: str
) -> Dict[str, Any]:
    """
    Process wage determination for H-1B project in Step 3.

    This function:
    1. Checks if we already have cached SOC code and wage tiers
    2. If cached, returns the cached data
    3. If not cached, calculates SOC code via ML classifier
    4. Looks up wage tiers from database
    5. Saves both to project_detail table for future use

    Args:
        db: Database session
        project_id: ID of the project
        job_description: Job description text for classification
        zipcode: Workplace zip code for wage lookup

    Returns:
        {
            "soc_code": "15-1252",
            "wage_tiers": {
                "level_1": 65000.00,
                "level_2": 85000.00,
                "level_3": 105000.00,
                "level_4": 125000.00
            },
            "from_cache": True/False
        }
    """

    # Step 1: Check if we already have cached data
    cached_soc = get_project_detail(db, project_id, ProjectDetailType.SOC_CODE)
    cached_wages = get_project_detail(
        db, project_id, ProjectDetailType.WAGE_TIERS, as_json=True)

    if cached_soc and cached_wages:
        logger.info(
            f"Using cached wage determination for project {project_id}")
        return {
            "soc_code": cached_soc,
            "wage_tiers": cached_wages,
            "from_cache": True
        }

    # Step 2: No cache, so calculate new
    logger.info(f"Calculating new wage determination for project {project_id}")

    # Step 3: Run ML classifier to get SOC code
    soc_code = await classify_job_description(job_description)
    logger.info(f"Classified job description to SOC code: {soc_code}")

    # Step 4: Save SOC code to database immediately
    save_project_detail(db, project_id, ProjectDetailType.SOC_CODE, soc_code)

    # Step 5: Lookup wage tiers from database
    wage_tiers = lookup_wage_tiers_from_db(db, soc_code, zipcode)
    logger.info(f"Retrieved wage tiers for SOC {soc_code} in {zipcode}")

    # Step 6: Save wage tiers to database
    save_project_detail(
        db, project_id, ProjectDetailType.WAGE_TIERS, wage_tiers)

    return {
        "soc_code": soc_code,
        "wage_tiers": wage_tiers,
        "from_cache": False
    }


async def classify_job_description(job_description: str) -> str:
    """
    Run ML classifier on job description to get SOC/ONET code.

    TODO: Replace this with your actual ML inference lambda classifier

    Args:
        job_description: Job description text

    Returns:
        SOC code like '15-1252' or '51-9081'
    """
    # result = await lambda_classifier.predict(job_description)
    # return result.soc_code
    logger.warning(
        "Using placeholder SOC code - implement your ML classifier here")
    return "15-1252"  # Placeholder


def lookup_wage_tiers_from_db(db: Session, soc_code: str, zipcode: str) -> Dict[str, float]:
    """
    Lookup wage tiers from your existing wage tables.
    Uses WageZipArea, WageJob, and WageAreaJob tables.

    Args:
        db: Database session
        soc_code: SOC code like '15-1252'
        zipcode: 5-digit zip code

    Returns:
        {
            "level_1": 65000.00,
            "level_2": 85000.00,
            "level_3": 105000.00,
            "level_4": 125000.00
        }
    """

    # Step 1: Find wage area for this zipcode
    zip_area = db.query(WageZipArea).filter(
        WageZipArea.zip == zipcode[:5]
    ).first()

    if not zip_area:
        raise ValueError(f"No wage area found for zipcode: {zipcode}")

    # Step 2: Find job with this SOC code
    job = db.query(WageJob).filter(
        WageJob.code == soc_code
    ).first()

    if not job:
        raise ValueError(f"No job found for SOC code: {soc_code}")

    # Step 3: Get wage data for this area and job
    wage_data = db.query(WageAreaJob).filter(
        WageAreaJob.area_id == zip_area.area_id,
        WageAreaJob.job_id == job.id
    ).first()

    if not wage_data:
        raise ValueError(f"No wage data found for SOC {soc_code} in this area")

    # Step 4: Return wage tiers
    return {
        "level_1": float(wage_data.wage_tier_1),
        "level_2": float(wage_data.wage_tier_2),
        "level_3": float(wage_data.wage_tier_3),
        "level_4": float(wage_data.wage_tier_4)
    }
