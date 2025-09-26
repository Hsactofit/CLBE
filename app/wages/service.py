from fastapi import HTTPException
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
from app.documents.service import get_document_blob

import logging
from io import BytesIO
from pypdf import PdfReader

from app.wages.onet_classifier_service import onet_classifier_service
from app.workflow.service import complete_workflow_step, complete_workflow_steps

logger = logging.getLogger("uvicorn.error")


async def get_tiers_from_current_project_state(
    *, db: DBSession, project: Project
) -> WageTierPublic:
    print("--> Getting tiers from current project state")

    # get the current response for the beneficiary zip code field in the I-129 form for the project
    zip_code = await get_zip_code_from_project_form(
        db=db,
        project=project,
        form_template_name="I-129",
        field_key="Beneficiary.USAddress.ZIP",
    )

    if not zip_code:
        raise HTTPException(
            status_code=404, detail="Beneficiary zip code field not found"
        )

    # find the current job description document
    job_description = await get_job_description_from_document_type(
        db=db, project=project, document_type_code="employment_letter"
    )

    # infer the SOC code from the job description first
    soc_code = await onet_classifier_service.infer_soc_code_from_document(
        job_description=job_description
    )

    print("--> soc_code", soc_code)

    # correct suffixed SOC code - remove the last 3 characters if format is like "XX-XXXX.XX"
    if len(soc_code) == 10 and soc_code[7] == ".":
        soc_code = soc_code[:-3]  # Remove last 3 characters (.XX)

    print("--> corrected soc_code", soc_code)

    if not soc_code:
        raise HTTPException(
            status_code=404,
            detail="SOC code could not be inferred from employment letter",
        )

    # finally get the tiers for the SOC code via db lookup
    tiers = await get_tiers_by_zip_and_soc(db=db, zip_code=zip_code, soc_code=soc_code)

    # and mark the workflow steps as complete
    await complete_workflow_steps(
        db=db,
        project=project,
        workflow_step_keys=[
            "H1B_WAGE_DETERMINATION",
            "H1B_WAGE_DETERMINATION_ONET",
            "H1B_WAGE_DETERMINATION_WAGE_TIERS",
        ],
    )

    return tiers


async def get_zip_code_from_project_form(
    *, db: DBSession, project: Project, form_template_name: str, field_key: str
) -> str:
    # get the current response for the beneficiary zip code field in the I-129 form for the project
    print("--> Getting zip code from project form")

    zip_code_response = (
        db.query(FormFieldResponse)
        .join(Form, FormFieldResponse.form_id == Form.id)
        .join(FormTemplate, Form.form_template_id == FormTemplate.id)
        .join(
            FormTemplateField,
            FormFieldResponse.form_template_field_id == FormTemplateField.id,
        )
        .filter(
            Form.project_id == project.id,
            FormTemplate.name == form_template_name,
            FormTemplateField.key == field_key,
        )
        .first()
    )

    print("--> zip_code_response", zip_code_response)

    if not zip_code_response:
        return None

    return zip_code_response.value


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

    print("--> document", document)

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

        print("--> all_text", all_text)

        return all_text

    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return "Error: Could not extract text from PDF"


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
        WageTierLevelPublic(level=1, wage=float(area_job.wage_tier_1)),
        WageTierLevelPublic(level=2, wage=float(area_job.wage_tier_2)),
        WageTierLevelPublic(level=3, wage=float(area_job.wage_tier_3)),
        WageTierLevelPublic(level=4, wage=float(area_job.wage_tier_4)),
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
