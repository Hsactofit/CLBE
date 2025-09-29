from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date
from typing import List
from app.models import (
    FormTemplateFieldSubTypes,
    FormTemplateFieldTypes,
    ProjectFilingType,
    ProjectPriority,
)
import uuid

# ============================================================================
# UTILS
# ============================================================================


# Use CamelModel to create camelCase alias for snake_case fields
def to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ============================================================================
# USERS
# ============================================================================


class UserPublic(CamelModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: uuid.UUID = Field(..., description="User's public ID (UUID)")
    created_at: datetime = Field(..., description="User creation timestamp")
    updated_at: datetime = Field(..., description="User last update timestamp")


# ============================================================================
# CLIENTS
# ============================================================================


class ClientPublic(CamelModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: uuid.UUID = Field(..., description="Client's public ID (UUID)")
    name: str = Field(..., description="Client/company name")
    created_at: datetime = Field(..., description="Client creation timestamp")
    updated_at: datetime = Field(..., description="Client last update timestamp")


class ClientCreate(CamelModel):
    client_name: str = Field(..., description="Client/company name")
    trade_name: str = Field(..., description="Client trade name")
    first_name: str = Field(..., description="Client first name")
    last_name: str = Field(..., description="Client last name")
    address: str = Field(..., description="Client address")
    address2: str = Field(..., description="Client address2")
    city: str = Field(..., description="Client city")
    state: str = Field(..., description="Client state")
    zip: str = Field(..., description="Client zip")
    telephone: str = Field(..., description="Client telephone")
    naics_code: str = Field(..., description="Client NAICS code")
    fein: str = Field(..., description="Client FEIN")
    user_email: str | None = Field(None, description="User's email address")


class ClientCreateResponse(CamelModel):
    client_public_id: uuid.UUID = Field(..., description="Client's public ID (UUID)")
    client_name: str = Field(..., description="Client/company name")
    user_email: str | None = Field(None, description="User's email address")
    user_public_id: uuid.UUID = Field(..., description="User's public ID (UUID)")


class ClientCreateRequest(CamelModel):
    """Explicit request body for POST /clients so Swagger shows fields."""

    clerk_user_id: str = Field(..., description="Clerk user ID")
    client_name: str = Field(..., description="Client name")
    trade_name: str = Field(..., description="Client trade name")
    first_name: str = Field(..., description="Client first name")
    last_name: str = Field(..., description="Client last name")
    address: str = Field(..., description="Client address")
    address2: str = Field(..., description="Client address2")
    city: str = Field(..., description="Client city")
    state: str = Field(..., description="Client state")
    zip: str = Field(..., description="Client zip")
    telephone: str = Field(..., description="Client telephone")
    naics_code: str = Field(..., description="Client NAICS code")
    fein: str = Field(..., description="Client FEIN")
    email: str | None = Field(None, description="User's email address")


# ============================================================================
# PROJECTS
# ============================================================================


class ProjectCreate(CamelModel):
    type_id: int = Field(..., description="Project type ID")
    beneficiary_first_name: str = Field(..., description="Beneficiary first name")
    beneficiary_last_name: str = Field(..., description="Beneficiary last name")
    position_title: str | None = Field(None, description="Position title")
    filing_type: ProjectFilingType = Field(..., description="Filing type")
    deadline: date | None = Field(None, description="Project deadline (date-only)")
    priority: ProjectPriority = Field(ProjectPriority.MEDIUM, description="Priority")
    premium_processing: bool | None = Field(None, description="Premium processing")
    notes: str | None = Field(None, description="Case notes")


class ProjectTypePublic(CamelModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Project type ID")
    name: str = Field(..., description="Project type name")
    description: str | None = Field(None, description="Project type description")
    sequence: int = Field(..., description="Project type sequence")
    enabled: bool = Field(..., description="Project type enabled")


class ProjectTypesPublic(CamelModel):
    types: list[ProjectTypePublic] = Field(..., description="List of project types")


class ProjectPublic(CamelModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: uuid.UUID = Field(..., description="Project's public ID (UUID)")
    type: ProjectTypePublic = Field(..., description="Project type")
    beneficiary_first_name: str = Field(..., description="Beneficiary first name")
    beneficiary_last_name: str = Field(..., description="Beneficiary last name")
    position_title: str | None = Field(None, description="Position title")
    filing_type: ProjectFilingType = Field(..., description="Filing type")
    deadline: date | None = Field(None, description="Project deadline (date-only)")
    priority: ProjectPriority = Field(ProjectPriority.MEDIUM, description="Priority")
    premium_processing: bool | None = Field(None, description="Premium processing")
    notes: str | None = Field(None, description="Case notes")
    started_at: datetime = Field(..., description="Project start timestamp")
    updated_at: datetime = Field(..., description="Project last update timestamp")

    completed: bool = Field(..., description="Project completion status")


class ProjectsPublic(CamelModel):
    projects: list[ProjectPublic] = Field(..., description="List of projects")


class WorkflowStepPublic(CamelModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Workflow step ID")
    name: str = Field(..., description="Workflow step name")
    description: str | None = Field(None, description="Workflow step description")
    key: str | None = Field(None, description="Workflow step key")
    is_active_step: bool = Field(
        ..., description="Whether this type is the current step"
    )
    icon: str | None = Field(None, description="Workflow step icon")
    sequence: int = Field(..., description="Workflow step sequence")
    started_at: datetime | None = Field(
        None, description="Workflow step start timestamp"
    )
    completed_at: datetime | None = Field(
        None, description="Workflow step completion timestamp"
    )
    child_steps: list["WorkflowStepPublic"] | None = Field(
        None, description="List of child workflow steps"
    )


class WorkflowStepsPublic(CamelModel):
    steps: list[WorkflowStepPublic] = Field(..., description="List of workflow steps")


# ============================================================================
# DOCUMENTS
# ============================================================================


class DocumentTypePublic(CamelModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., description="Document type name")
    code: str = Field(..., description="Document type code, common to vision lambda")
    description: str | None = Field(None, description="Document type description")
    sequence: int = Field(..., description="Ordering sequence")
    required: bool = Field(..., description="Whether this type is required")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class DocumentTypesPublic(CamelModel):
    types: list[DocumentTypePublic] = Field(..., description="List of document types")


class DocumentPublic(CamelModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: uuid.UUID = Field(..., description="Document's public ID (UUID)")
    created_at: datetime = Field(..., description="Document creation timestamp")
    updated_at: datetime = Field(..., description="Document last update timestamp")
    name: str = Field(..., description="Document name")
    content_type: str | None = Field(
        None, description="Document content type (e.g., application/pdf, image/jpeg)"
    )
    inferred_type: DocumentTypePublic | None = Field(
        None, description="Resolved document type"
    )
    extracted_data: dict | None = Field(None, description="Document extracted data")


class DocumentsPublic(CamelModel):
    documents: list[DocumentPublic] = Field(..., description="List of documents")


# ============================================================================
# FORMS
# ============================================================================


class FormPublic(CamelModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: uuid.UUID = Field(..., description="Form's public ID (UUID)")
    created_at: datetime = Field(..., description="Form creation timestamp")
    updated_at: datetime = Field(..., description="Form last update timestamp")

    completed: bool = Field(..., description="Form completion status")
    form_template_name: str = Field(..., description="Form template name")


class FormsPublic(CamelModel):
    forms: list[FormPublic] = Field(..., description="List of forms")


class SectionPublic(CamelModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: uuid.UUID = Field(..., description="Section's public ID (UUID)")
    sequence: int = Field(..., description="Section sequence")
    created_at: datetime = Field(..., description="Section creation timestamp")
    updated_at: datetime = Field(..., description="Section last update timestamp")

    name: str = Field(..., description="Section name")


class SectionsPublic(CamelModel):
    sections: List[SectionPublic] = Field(..., description="List of sections")


class FieldOptionPublic(CamelModel):
    key: str = Field(..., description="Field option key")
    name: str | None = Field(None, description="Field option name")


class FieldPublic(CamelModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., description="Field name")
    # could be None if the field is not filled yet
    value: str | None = Field(None, description="Field value")
    role: str | None = Field(None, description="respondent role")
    key: str = Field(..., description="Field key")
    optional: bool = Field(..., description="Field optional")
    css_class: str | None = Field(None, description="Field CSS class")
    sequence: int = Field(..., description="Field sequence")
    type: FormTemplateFieldTypes = Field(..., description="Field type")
    sub_type: FormTemplateFieldSubTypes | None = Field(
        None, description="Field sub type"
    )
    options: List[FieldOptionPublic] | None = Field(None, description="Field options")
    is_dependency_target: bool = False


class ResponsePublic(CamelModel):
    # Schema for posting field values back to the server
    key: str = Field(..., description="Field key to identify the field")
    value: str | None = Field(None, description="Field value")
    role: str | None = Field(None, description="respondent role")


class ResponsesPublic(CamelModel):
    fields: List[ResponsePublic] = Field(..., description="List of field responses")


class FieldsPublic(CamelModel):
    fields: list[FieldPublic] = Field(..., description="List of fields")


class SectionFieldsPublic(SectionPublic):
    """Section with its fields - extends SectionPublic"""

    fields: List[FieldPublic] = Field(..., description="List of fields")


class WageTierLevelPublic(CamelModel):
    level: int = Field(..., description="Wage tier level")
    wage: float = Field(..., description="Wage")


class WageTierLevelsPublic(CamelModel):
    levels: list[WageTierLevelPublic] = Field(
        ..., description="List of wage tier levels"
    )


class WageTierPublic(CamelModel):
    levels: list[WageTierLevelPublic] = Field(
        ..., description="List of wage tier levels"
    )
    zip_code: str | None = Field(None, description="Zip code")
    area_code: str | None = Field(None, description="Wage area code")
    area_name: str | None = Field(None, description="Wage area name")
    job_code: str | None = Field(None, description="SOC/OES code")
    job_name: str | None = Field(None, description="Job name")
    job_description: str | None = Field(None, description="Job description")
