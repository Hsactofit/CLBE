from sqlalchemy import (
    Integer,
    Numeric,
    String,
    Boolean,
    TIMESTAMP,
    Date,
    ForeignKey,
    Text,
    JSON,
    Enum as SQLAlchemyEnum,
    UUID,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
import datetime
from app.database import Base
from sqlalchemy.orm import Session as DBSession
from typing import Optional, List
from dataclasses import dataclass
from enum import Enum
import uuid

# ============================================================================
# USER
# ============================================================================


class UserRole(Enum):
    ADMINISTRATOR = "ADMINISTRATOR"
    CLIENT = "CLIENT"


class ProjectDetailType(Enum):
    """Types of project-specific details"""
    SOC_CODE = "SOC_CODE"
    WAGE_TIERS = "WAGE_TIERS"
class User(Base):
    __tablename__ = "user"

    # Internal ID for database operations
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Public UUID for external references
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        unique=True,
        index=True,
    )
    # External ID (Clerk user_id): user_2z6qB1BzsLNk4s8cUKVf4oz7Ylt
    external_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    # important
    role: Mapped[UserRole] = mapped_column(
        SQLAlchemyEnum(UserRole, native_enum=False), nullable=False
    )

    # User information
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    # Authentication tracking
    last_authenticated_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )
    # Foreign Key and Relationship
    clients: Mapped[List["Client"]] = relationship(back_populates="user")


# ============================================================================
# CLIENT
# ============================================================================


class Client(Base):
    __tablename__ = "client"

    # Internal ID for database operations
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Public UUID for external references
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        unique=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    trade_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    first_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=False)
    last_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=False)
    address2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(255), nullable=False)
    state: Mapped[Optional[str]] = mapped_column(String(255), nullable=False)
    zip: Mapped[Optional[str]] = mapped_column(String(255), nullable=False)
    telephone: Mapped[Optional[str]] = mapped_column(String(255), nullable=False)
    naics_code: Mapped[Optional[str]] = mapped_column(String(255), nullable=False)
    fein: Mapped[Optional[str]] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )

    projects: Mapped[List["Project"]] = relationship(
        back_populates="client", cascade="all, delete-orphan", passive_deletes=True
    )
    # Foreign Key and Relationship
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("user.id"), nullable=True, index=True
    )
    user: Mapped[Optional["User"]] = relationship(back_populates="clients")


@dataclass
class UserState:
    user: User
    client: Client
    db: DBSession


# ============================================================================
# PROJECT
# ============================================================================


class ProjectType(Base):
    __tablename__ = "project_type"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sequence: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )

    # Relationship to projects
    projects: Mapped[List["Project"]] = relationship(back_populates="type")
    # Relationship to workflow steps (one project type has many workflow steps)
    workflow_steps: Mapped[List["WorkflowStep"]] = relationship(
        back_populates="project_type"
    )


class ProjectFilingType(Enum):
    LOTTERY = "LOTTERY"
    NEW_FILING = "NEW_FILING"
    TRANSFER = "TRANSFER"
    EXTENSION = "EXTENSION"
    AMENDMENT = "AMENDMENT"


class ProjectPriority(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Project(Base):
    __tablename__ = "project"

    # Internal ID for database operations
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Public UUID for external references
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        unique=True,
        index=True,
    )

    beneficiary_first_name: Mapped[str] = mapped_column(String(255), nullable=False)
    beneficiary_last_name: Mapped[str] = mapped_column(String(255), nullable=False)
    position_title: Mapped[str] = mapped_column(String(255), nullable=True)
    filing_type: Mapped[ProjectFilingType] = mapped_column(
        SQLAlchemyEnum(ProjectFilingType, native_enum=False), nullable=False
    )
    deadline: Mapped[datetime.date] = mapped_column(Date, nullable=True)
    priority: Mapped[ProjectPriority] = mapped_column(
        SQLAlchemyEnum(ProjectPriority, native_enum=False), nullable=False
    )

    premium_processing: Mapped[bool] = mapped_column(Boolean, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )

    # Foreign Key and Relationship
    type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("project_type.id"), nullable=False, index=True
    )
    type: Mapped["ProjectType"] = relationship(back_populates="projects")

    # Form filling tracking
    completed: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false")
    )
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Foreign Key and Relationship
    client_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("client.id", ondelete="CASCADE"), nullable=False, index=True
    )
    client: Mapped["Client"] = relationship(back_populates="projects")
    forms: Mapped[List["Form"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", passive_deletes=True
    )  # TODO: add form template id
    documents: Mapped[List["Document"]] = relationship(back_populates="project")
    # Relationship to workflow steps for this project (join table entity)
    workflow_steps: Mapped[List["ProjectWorkflowStep"]] = relationship(
        back_populates="project"
    )
    details: Mapped[List["ProjectDetail"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan"
    )

class ProjectDetail(Base):
    """
    Stores project-specific data points that don't fit in the normalized schema.
    Used for caching computed values like wage determinations for H-1B projects.
    """
    __tablename__ = "project_detail"

    # Internal ID for database operations
    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)

    # Public UUID for external references
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        unique=True,
        index=True,
    )

    # Foreign key to project
    project_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    project: Mapped["Project"] = relationship(back_populates="details")

    # Detail type and value
    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    value: Mapped[str] = mapped_column(Text, nullable=False)

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("now()"),
        onupdate=text("now()")
    )

    # Ensure one detail per type per project
    __table_args__ = (
        UniqueConstraint('project_id', 'type',
                         name='uq_project_detail_project_type'),
    )

@dataclass
class ProjectState:
    project: Project
    user: User
    client: Client
    db: DBSession


# ============================================================================
# DOCUMENT
# ============================================================================


class DocumentType(Base):
    __tablename__ = "document_type"

    # Internal ID for database operations
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    code: Mapped[str] = mapped_column(String(100), nullable=False)

    # New fields
    sequence: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    required: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )

    # Relationship
    documents: Mapped[List["Document"]] = relationship(back_populates="inferred_type")


class Document(Base):
    __tablename__ = "document"

    # Internal ID for database operations
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Public UUID for external references
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        unique=True,
        index=True,
    )

    # default
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )

    # important
    name: Mapped[str] = mapped_column(
        String(255), nullable=False
    )  # e.g., "0612passport.pdf", "george_birth_certificate.jpg"
    content_type: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # e.g., "application/pdf", "image/jpeg"
    # New foreign key to document_type
    inferred_type_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("document_type.id"), nullable=True, index=True
    )
    extracted_data: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )  # JSON key-value pairs

    # Foreign Key and Relationship
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("project.id"), nullable=False, index=True
    )
    project: Mapped["Project"] = relationship(back_populates="documents")

    # Relationship to DocumentType
    inferred_type: Mapped[Optional["DocumentType"]] = relationship(
        back_populates="documents"
    )


# ============================================================================
# FORM TEMPLATE
# ============================================================================
class FormTemplateStatus(Enum):
    ACTIVE = "ACTIVE"
    DRAFT = "DRAFT"
    TOMBSTONED = "TOMBSTONED"


class FormTemplateFieldTypes(Enum):
    TEXT = "TEXT"
    NUMBER = "NUMBER"
    DATE = "DATE"
    BOOLEAN = "BOOLEAN"
    SELECT_ONE = "SELECT_ONE"
    SELECT_MANY = "SELECT_MANY"
    SIGNATURE = "SIGNATURE"


class FormTemplateFieldSubTypes(Enum):
    EMAIL = "EMAIL"
    US_TELEPHONE = "US_TELEPHONE"
    SSN = "SSN"
    FEIN = "FEIN"
    NAICS_CODE = "NAICS_CODE"
    ZIP_CODE = "ZIP_CODE"
    US_STATE = "US_STATE"


class FormTemplate(Base):
    __tablename__ = "form_template"
    # Internal ID for database operations
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Public UUID for external references
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        unique=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[FormTemplateStatus] = mapped_column(
        SQLAlchemyEnum(FormTemplateStatus, native_enum=False),
        default=FormTemplateStatus.ACTIVE,
        server_default=text("'ACTIVE'"),
    )

    # Foreign Key and Relationship
    sections: Mapped[List["FormTemplateSection"]] = relationship(
        back_populates="form_template", cascade="all, delete-orphan"
    )
    forms: Mapped[List["Form"]] = relationship(
        back_populates="form_template", cascade="all, delete-orphan"
    )


class FormTemplateSection(Base):
    __tablename__ = "form_template_section"
    # Internal ID for database operations
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Public UUID for external references
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        unique=True,
        index=True,
    )

    # default
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )

    sequence: Mapped[int] = mapped_column(Integer, nullable=False)

    # optional and for future
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Foreign Key and Relationship
    form_template_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("form_template.id"), nullable=False, index=True
    )
    form_template: Mapped["FormTemplate"] = relationship(back_populates="sections")
    fields: Mapped[List["FormTemplateField"]] = relationship(
        back_populates="section", cascade="all, delete-orphan"
    )


class FormTemplateField(Base):
    __tablename__ = "form_template_field"
    # Internal ID for database operations
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # default
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )
    deleted_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # important
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    pdf_field_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    dependency_expression: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    should_fill_on_form: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("true")
    )
    type: Mapped[FormTemplateFieldTypes] = mapped_column(
        SQLAlchemyEnum(FormTemplateFieldTypes, native_enum=False), nullable=False
    )

    sub_type: Mapped[FormTemplateFieldSubTypes | None] = mapped_column(
        SQLAlchemyEnum(FormTemplateFieldSubTypes, native_enum=False), nullable=True
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    key: Mapped[str] = mapped_column(String(255), nullable=False)
    optional: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false")
    )

    # optional and for future
    alternative_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    field_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    minimum_length: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    maximum_length: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    css_class: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Foreign Key and Relationship
    section_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("form_template_section.id"), nullable=False, index=True
    )
    section: Mapped["FormTemplateSection"] = relationship(back_populates="fields")
    options: Mapped[List["FormTemplateFieldOption"]] = relationship(
        back_populates="field", cascade="all, delete-orphan"
    )
    responses: Mapped[List["FormFieldResponse"]] = relationship(
        back_populates="form_template_field", cascade="all, delete-orphan"
    )


class FormTemplateFieldOption(Base):
    __tablename__ = "form_template_field_option"
    # Internal ID for database operations
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # default
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )
    deleted_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # important
    key: Mapped[str] = mapped_column(String(255), nullable=False)
    pdf_field_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Foreign Key and Relationship
    field_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("form_template_field.id"), nullable=False, index=True
    )
    field: Mapped["FormTemplateField"] = relationship(back_populates="options")


# ============================================================================
# FORM
# ============================================================================


class Form(Base):
    __tablename__ = "form"
    # Internal ID for database operations
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Public UUID for external references
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        unique=True,
        index=True,
    )
    # default
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )
    deleted_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # important
    form_template_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("form_template.id"), nullable=False
    )
    form_template: Mapped["FormTemplate"] = relationship(back_populates="forms")

    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    project: Mapped["Project"] = relationship(back_populates="forms")

    responses: Mapped[List["FormFieldResponse"]] = relationship(back_populates="form")

    completed: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false")
    )
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )


class FormFieldResponseRole(Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"


class FormFieldResponse(Base):
    __tablename__ = "form_field_response"
    # Internal ID for database operations
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Public UUID for external references
    public_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        unique=True,
        index=True,
    )
    # default
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )
    deleted_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # important
    form_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("form.id", ondelete="CASCADE"), nullable=False
    )
    form: Mapped["Form"] = relationship(back_populates="responses")

    form_template_field_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("form_template_field.id", ondelete="CASCADE")
    )
    form_template_field: Mapped["FormTemplateField"] = relationship(
        back_populates="responses"
    )

    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    role: Mapped[FormFieldResponseRole] = mapped_column(
        SQLAlchemyEnum(FormFieldResponseRole, native_enum=False),
        default=FormFieldResponseRole.USER,
        server_default=text("'USER'"),
    )


class WorkflowStep(Base):
    __tablename__ = "workflow_step"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    project_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("project_type.id"), nullable=False
    )
    project_type: Mapped["ProjectType"] = relationship(back_populates="workflow_steps")

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key: Mapped[str] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    estimated_duration_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    estimated_duration_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    parent_step_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("workflow_step.id"), nullable=True
    )
    parent_step: Mapped[Optional["WorkflowStep"]] = relationship(
        back_populates="child_steps",
        remote_side="WorkflowStep.id",
        foreign_keys="WorkflowStep.parent_step_id",
    )
    child_steps: Mapped[List["WorkflowStep"]] = relationship(
        back_populates="parent_step",
        foreign_keys="WorkflowStep.parent_step_id",
    )

    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    # Relationship to project_workflow_step join entities
    project_workflow_steps: Mapped[List["ProjectWorkflowStep"]] = relationship(
        back_populates="workflow_step"
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )


class ProjectWorkflowStep(Base):
    __tablename__ = "project_workflow_step"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("project.id"), nullable=False
    )
    project: Mapped["Project"] = relationship(back_populates="workflow_steps")

    workflow_step_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("workflow_step.id"), nullable=False
    )
    workflow_step: Mapped["WorkflowStep"] = relationship(
        back_populates="project_workflow_steps"
    )

    started_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("false")
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )


class WageArea(Base):
    __tablename__ = "wage_area"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(15), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    zip_areas: Mapped[list["WageZipArea"]] = relationship(back_populates="area")
    area_jobs: Mapped[list["WageAreaJob"]] = relationship(back_populates="area")
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )


class WageZipArea(Base):
    __tablename__ = "wage_zip_area"
    __table_args__ = (
        UniqueConstraint("zip", "area_id", name="uq_wage_zip_area_zip_area_id"),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zip: Mapped[str] = mapped_column(String(5), nullable=False, index=True)
    area_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("wage_area.id"), nullable=False
    )
    area: Mapped["WageArea"] = relationship(back_populates="zip_areas")
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )


class WageJob(Base):
    __tablename__ = "wage_job"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    code: Mapped[str] = mapped_column(String(15), nullable=False, unique=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=False)

    area_jobs: Mapped[list["WageAreaJob"]] = relationship(back_populates="job")

    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )


class WageAreaJob(Base):
    __tablename__ = "wage_area_job"
    __table_args__ = (
        UniqueConstraint("area_id", "job_id", name="uq_wage_area_job_area_id_job_id"),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    area_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("wage_area.id"), nullable=False
    )
    area: Mapped["WageArea"] = relationship(back_populates="area_jobs")
    job_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("wage_job.id"), nullable=False
    )
    job: Mapped["WageJob"] = relationship(back_populates="area_jobs")
    wage_tier_1: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    wage_tier_2: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    wage_tier_3: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    wage_tier_4: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()")
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )
