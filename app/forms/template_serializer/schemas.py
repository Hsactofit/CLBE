"""
Pydantic schemas for form template serialization
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from app.models import FormTemplateFieldTypes, FormTemplateStatus


class SerializedFormTemplateField(BaseModel):
    """Schema for form template fields"""

    key: str = Field(..., description="Field unique key describing the field name")
    value: str | None = Field(None, description="Field value")


class SerializedFormTemplateSection(BaseModel):
    """Schema for form template sections"""

    name: str = Field(..., description="Section name")

    # Fields in this section
    fields: list[SerializedFormTemplateField] = Field(
        ..., description="Fields in this section"
    )


class SerializedFormTemplate(BaseModel):
    """Schema for complete form template"""

    name: str = Field(..., description="Form template name")
    description: Optional[str] = Field(None, description="Form template description")

    # Sections in this template
    sections: list[SerializedFormTemplateSection] = Field(
        ..., description="Sections in this template"
    )
