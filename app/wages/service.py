from io import BytesIO
import os
from fastapi import HTTPException
from pypdf import PdfReader
from app.documents.service import get_document_blob
from app.documents.storage import S3_BUCKET
import app.forms.service as form_service

from app.models import (
    FormTemplate,
    FormTemplateField,
    FormFieldResponse,
    Project,
    WageArea,
    WageAreaJob,
    WageJob,
    Document,
    DocumentType,
    Form,
    WageZipArea,
)
from app.models import DBSession
from app.schemas import WageTierLevelPublic, WageTierPublic

import logging

from app.wages.onet_classifier_service import onet_classifier_service

logger = logging.getLogger("uvicorn.error")

S3_STORAGE = os.getenv("S3_STORAGE")


async def get_tiers_from_current_project_state(
    *, db: DBSession, project: Project
) -> WageTierPublic:
    print("--> Getting tiers from current project state")

    # get the current response for the beneficiary zip code field in the I-129 form for the project
    zip_code = await form_service.get_response_value_from_project_form(
        db=db,
        project=project,
        form_template_name="I-129",
        field_key="Beneficiary.USAddress.ZIP",
    )

    if not zip_code:
        raise HTTPException(
            status_code=404, detail="Beneficiary zip code field not found"
        )

    print("--> Zip code", zip_code)

    # get the current annual salary from the project form
    annual_salary = await form_service.get_response_value_from_project_form(
        db=db,
        project=project,
        form_template_name="I-129",
        field_key="Job.Salary.Annual",
    )

    try:
        annual_salary = int(annual_salary)
    except (TypeError, ValueError):
        annual_salary = None

    print("--> Annual salary", annual_salary)

    job_description_document = await get_job_description_document_from_document_type(
        db=db,
        project=project,
        document_type_code="employment_letter",
    )

    print("--> Job description document", job_description_document)

    soc_code = await get_soc_code_from_document(
        db=db,
        project=project,
        job_description_document=job_description_document,
    )

    print("--> Soc code", soc_code)

    if not soc_code:
        raise HTTPException(
            status_code=404,
            detail="SOC code could not be inferred from employment letter",
        )

    # correct suffixed SOC code - remove the last 3 characters if format is like "XX-XXXX.XX"
    if len(soc_code) == 10 and soc_code[7] == ".":
        soc_code = soc_code[:-3]  # Remove last 3 characters (.XX)

    print("--> Corrected soc_code", soc_code)

    # finally get the tiers for the SOC code via db lookup
    tiers = await get_tiers_by_zip_and_soc(db=db, zip_code=zip_code, soc_code=soc_code)

    print("--> Annual salary", annual_salary)

    if annual_salary:
        lastIndex = -1

        for index, tier in enumerate(tiers.levels):
            if tier.wage < annual_salary:
                lastIndex = index

        if lastIndex > -1:
            tiers.levels[lastIndex].selected = True

    print("--> Tiers", tiers)

    # and mark the workflow steps as complete
    # actually don't do this, wait for the user to click the Next button to complete the workflow steps
    """
    await complete_workflow_steps(
        db=db,
        project=project,
        workflow_step_keys=[
            "H1B_WAGE_DETERMINATION",
            "H1B_WAGE_DETERMINATION_ONET",
            "H1B_WAGE_DETERMINATION_WAGE_TIERS",
        ],
    )
    """

    return tiers


async def get_job_description_document_from_document_type(
    *, db: DBSession, project: Project, document_type_code: str
) -> Document:
    document = (
        db.query(Document)
        .join(DocumentType, Document.inferred_type_id == DocumentType.id)
        .filter(
            Document.project_id == project.id, DocumentType.code == document_type_code
        )
        .first()
    )

    print("--> Document", document)

    if not document:
        raise HTTPException(
            status_code=404, detail="Employment letter document not found"
        )

    return document


async def get_job_description_from_document_type(
    *, db: DBSession, project: Project, document_type_code: str
) -> str:
    document = (
        db.query(Document)
        .join(DocumentType, Document.inferred_type_id == DocumentType.id)
        .filter(
            Document.project_id == project.id, DocumentType.code == document_type_code
        )
        .first()
    )

    print("--> Document", document)

    if not document:
        raise HTTPException(
            status_code=404, detail="Employment letter document not found"
        )

    # download the document blob from storage
    file_bytes = await get_document_blob(document=document, project=project)

    if not file_bytes:
        raise HTTPException(
            status_code=404,
            detail="Employment letter document blob could not be downloaded",
        )

    # TODO probably should point the lambda directly to the file in S3 rather than passing the blob around

    # Convert PDF bytes to text
    try:
        pdf_file = BytesIO(file_bytes)
        pdf_reader = PdfReader(pdf_file)

        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"

        all_text = text.strip()

        print("--> All text", all_text)

        return all_text

    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return "Error: Could not extract text from PDF"


async def get_soc_code_from_document(
    *, db: DBSession, project: Project, job_description_document: Document
) -> str:
    if S3_STORAGE == "True":
        # find the current job description document
        job_description_document = (
            await get_job_description_document_from_document_type(
                db=db, project=project, document_type_code="employment_letter"
            )
        )

        file_url = f"https://{S3_BUCKET}.s3.amazonaws.com/documents/{project.client.public_id}/{project.public_id}/uploads/{job_description_document.public_id}"
        print("--> File url", file_url)

        # infer the SOC code from the job description
        soc_code = await onet_classifier_service.infer_soc_code_from_document(
            file_url=file_url
        )

        return soc_code
    else:
        job_description = await get_job_description_from_document_type(
            db=db, project=project, document_type_code="employment_letter"
        )
        soc_code = await onet_classifier_service.infer_soc_code_from_text(
            job_description=job_description
        )

        return soc_code


async def get_tiers_by_zip_and_soc(
    *, db: DBSession, zip_code: str, soc_code: str
) -> WageTierPublic:
    row = (
        db.query(WageAreaJob, WageArea, WageJob)
        .join(WageArea, WageAreaJob.area_id == WageArea.id)
        .join(WageJob, WageAreaJob.job_id == WageJob.id)
        .join(WageZipArea, WageArea.id == WageZipArea.area_id)
        .filter(WageZipArea.zip == zip_code, WageJob.code == soc_code)
        .first()
    )

    if row is None:
        raise HTTPException(
            status_code=404, detail="Wage tiers not found for zip code and SOC code"
        )

    area_job, area, job = row

    levels = [
        WageTierLevelPublic(level=1, wage=float(area_job.wage_tier_1), selected=False),
        WageTierLevelPublic(level=2, wage=float(area_job.wage_tier_2), selected=False),
        WageTierLevelPublic(level=3, wage=float(area_job.wage_tier_3), selected=False),
        WageTierLevelPublic(level=4, wage=float(area_job.wage_tier_4), selected=False),
    ]

    return WageTierPublic(
        levels=levels,
        zip_code=zip_code,
        area_code=area.code,
        area_name=area.name,
        job_code=job.code,
        job_name=job.name,
        job_description=job.description,
    )
