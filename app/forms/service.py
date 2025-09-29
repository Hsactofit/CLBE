from sqlalchemy.orm import Session as DBSession
from sqlalchemy import and_
from app.models import (
    Form,
    FormTemplateSection,
    FormFieldResponse,
    FormFieldResponseRole,
    FormTemplateField,
    FormTemplateFieldOption,
    Project,
)
from app.schemas import (
    FormPublic,
    SectionFieldsPublic,
    FieldPublic,
    FieldOptionPublic,
    ResponsesPublic,
)
from app.documents.storage import storage
from app.forms.pdf.fill_pdf import AcroFormFiller, XFAFormFiller
from app.forms.pdf.dependency import check_dependency, get_dependency_target
from app.forms import cache
from collections import defaultdict
import uuid
import logging

logger = logging.getLogger("uvicorn.error")


# Helper functions for entity retrieval and validation
async def get_form_for_project(
    *, db: DBSession, project: Project, form_public_id: uuid.UUID
) -> Form:
    """Get and validate form belongs to project"""
    form = (
        db.query(Form)
        .filter(Form.project_id == project.id, Form.public_id == form_public_id)
        .first()
    )
    if not form:
        raise ValueError("Form not found")
    return form


async def get_section_for_form(
    *, db: DBSession, form: Form, section_public_id: uuid.UUID
) -> FormTemplateSection:
    """Get and validate section belongs to form"""
    section = (
        db.query(FormTemplateSection)
        .filter(
            FormTemplateSection.form_template_id == form.form_template_id,
            FormTemplateSection.public_id == section_public_id,
        )
        .first()
    )
    if not section:
        raise ValueError("Section not found")
    return section


# Main service functions
async def list_for_project(*, db: DBSession, project: Project) -> list[FormPublic]:
    """Get all forms for a project"""
    forms = project.forms
    return [
        FormPublic(
            public_id=form.public_id,
            created_at=form.created_at,
            updated_at=form.updated_at,
            completed=form.completed,
            form_template_name=form.form_template.name,
        )
        for form in forms
    ]


async def get_form_sections(
    *, db: DBSession, project: Project, form_public_id: uuid.UUID
):
    """Get form sections by form public ID"""
    form = await get_form_for_project(
        db=db, project=project, form_public_id=form_public_id
    )
    return form.form_template.sections


async def get_section_fields(
    *,
    db: DBSession,
    project: Project,
    form_public_id: uuid.UUID,
    section_public_id: uuid.UUID,
) -> SectionFieldsPublic:
    """Get section fields with responses and dependency checking"""
    # Get and validate form and section
    form = await get_form_for_project(
        db=db, project=project, form_public_id=form_public_id
    )
    section = await get_section_for_form(
        db=db, form=form, section_public_id=section_public_id
    )

    # Get all field options for fields in this section
    template_data = cache.get_section_template_data(db, section.id)
    template_fields = template_data['fields']
    options_dict = defaultdict(list)
    for field_id, field_options in template_data['options'].items():
        for option in field_options:
            options_dict[field_id].append(option)

    # Code for checking dependency
    dependency_targets = get_dependency_target(section.id, db)
    logger.info(f"Section {section.id} dependency_targets: {dependency_targets}")

    fields_public = []
    for field_id, template_field in template_fields.items():
        # Query response ad hoc for this specific field
        response = (
            db.query(FormFieldResponse)
            .filter(
                FormFieldResponse.form_id == form.id,
                FormFieldResponse.form_template_field_id == field_id
            )
            .first()
        )
        
        should_show = True
        if template_field.dependency_expression:
            should_show = check_dependency(
                template_field.dependency_expression, db, form.id
            )

        if should_show:
            fields_public.append(
                FieldPublic(
                    name=template_field.name,
                    key=template_field.key,
                    optional=template_field.optional,
                    css_class=template_field.css_class,
                    sequence=template_field.sequence,
                    type=template_field.type,
                    sub_type=template_field.sub_type,
                    value=response.value if response else None,
                    role=response.role if response else FormFieldResponseRole.USER,
                    is_dependency_target=template_field.key in dependency_targets,
                    options=[
                        FieldOptionPublic(
                            key=opt.key,
                            name=opt.name,
                        )
                        for opt in options_dict.get(template_field.id, [])
                    ]
                    if template_field.id in options_dict
                    else None,
                )
            )

    return SectionFieldsPublic(
        public_id=section.public_id,
        created_at=section.created_at,
        updated_at=section.updated_at,
        sequence=section.sequence,
        name=section.name,
        fields=fields_public,
    )


async def submit_section_responses(
    *,
    db: DBSession,
    project: Project,
    form_public_id: uuid.UUID,
    section_public_id: uuid.UUID,
    response_request: ResponsesPublic,
) -> dict:
    """Submit responses for a form section"""
    logger.info(
        f"submit_section_responses called with section_public_id: {section_public_id}"
    )

    # Get and validate form and section
    form = await get_form_for_project(
        db=db, project=project, form_public_id=form_public_id
    )
    section = await get_section_for_form(
        db=db, form=form, section_public_id=section_public_id
    )

    try:
        # Process each field response
        template_fields = cache.get_template_fields_for_section(db, section.id)
        fields_by_key = {field.key: field for field in template_fields.values()}
        
        for request_field_response in response_request.fields:
            logger.info(
                f"Filling field: {request_field_response.key} with value: {request_field_response.value}"
            )

            # Skip if this field is not filled
            if not request_field_response.value:
                continue

            # Check if this field is in the template
            template_field = fields_by_key.get(request_field_response.key)
            
            if not template_field:
                logger.warning(
                    f"Field {request_field_response.key} not found in template"
                )
                continue

            # Update the field response value and role
            db_field_response = (
                db.query(FormFieldResponse)
                .filter(
                    FormFieldResponse.form_id == form.id,
                    FormFieldResponse.form_template_field_id == template_field.id,
                )
                .first()
            )

            if not db_field_response:
                db_field_response = FormFieldResponse(
                    form_id=form.id,
                    form_template_field_id=template_field.id,
                    value=request_field_response.value,
                    role=request_field_response.role,
                )
                db.add(db_field_response)
            else:
                db_field_response.value = request_field_response.value
                db_field_response.role = request_field_response.role

        db.commit()
        return {"message": "Section responses submitted successfully"}

    except Exception:
        db.rollback()
        raise


async def generate_pdf_bytes(
    *, db: DBSession, project: Project, form_public_id: uuid.UUID
) -> bytes:
    """Generate and return PDF for a form"""
    # Get and validate form
    form = await get_form_for_project(
        db=db, project=project, form_public_id=form_public_id
    )

    if form.form_template.name == "I-130":
        # PDF paths
        pdf_output_path = f"documents/{project.client.public_id}/{project.public_id}/outputs/form_{form_public_id}.pdf"
        pdf_input_path = "app/forms/pdf/i-130-template.pdf"

        try:
            # Fill PDF
            pdf_filler = AcroFormFiller(pdf_input_path, pdf_output_path)
            await pdf_filler.fill_pdf(form.id, db)

            # Get PDF bytes from storage
            pdf_bytes = await storage.get_file(pdf_output_path)
            return pdf_bytes

        except Exception:
            raise
    elif form.form_template.name == "I-129":
        # PDF paths
        pdf_output_path = f"documents/{project.client.public_id}/{project.public_id}/outputs/form_{form_public_id}.pdf"
        pdf_input_path = "app/forms/pdf/i-129_template.pdf"

        try:
            # Fill PDF
            pdf_filler = AcroFormFiller(pdf_input_path, pdf_output_path)
            await pdf_filler.fill_pdf(form.id, db)

            # Get PDF bytes from storage
            pdf_bytes = await storage.get_file(pdf_output_path)
            return pdf_bytes

        except Exception:
            raise
    raise ValueError("PDF Filler is not supported for this form")
