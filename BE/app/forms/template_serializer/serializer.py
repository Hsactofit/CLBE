"""
Form template serialization service
"""

from sqlalchemy.orm import Session
from typing import Optional
from app.models import FormTemplate, FormTemplateSection, FormTemplateField
from app.forms.template_serializer.schemas import (
    SerializedFormTemplate,
    SerializedFormTemplateSection,
    SerializedFormTemplateField,
)


class FormTemplateSerializer:
    """Serializer for form template data"""

    @staticmethod
    def serialize_field(field: FormTemplateField) -> SerializedFormTemplateField:
        """Serialize field"""
        return SerializedFormTemplateField(key=field.key)

    @staticmethod
    def serialize_section(
        section: FormTemplateSection,
    ) -> SerializedFormTemplateSection:
        """Serialize section"""
        return SerializedFormTemplateSection(
            name=section.name,
            fields=[
                FormTemplateSerializer.serialize_field(field)
                for field in section.fields
            ],
        )

    @staticmethod
    def serialize_template(form_template: FormTemplate) -> SerializedFormTemplate:
        """Serialize complete form template"""
        return SerializedFormTemplate(
            name=form_template.name,
            description=form_template.description,
            sections=[
                FormTemplateSerializer.serialize_section(section)
                for section in form_template.sections
            ],
        )


class SerializerService:
    """Main serialization service"""

    @staticmethod
    def export_form_template(
        db: Session, form_template_id: int
    ) -> Optional[SerializedFormTemplate]:
        """Export form template to JSON schema"""
        form_template = (
            db.query(FormTemplate).filter(FormTemplate.id == form_template_id).first()
        )
        if not form_template:
            return None
        return FormTemplateSerializer.serialize_template(form_template)
