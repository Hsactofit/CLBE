"""
Form Template Cache Module

Global application-level cache for template data only.
Response data is NEVER cached - always fetched fresh from database.
"""

from sqlalchemy.orm import Session as DBSession
from collections import defaultdict
from typing import Dict, List, Optional
import threading

from app.models import (
    FormTemplateField,
    FormTemplateFieldOption,
    FormTemplateSection,
    Form,
    FormFieldResponse,
    FormTemplateFieldTypes,
)

# Global cache - persists until backend restart
_template_fields_cache: Dict[int, Dict[int, FormTemplateField]] = {}
_field_options_cache: Dict[int, List[FormTemplateFieldOption]] = {}
_sections_cache: Dict[int, FormTemplateSection] = {}
_form_template_sections_cache: Dict[int, List[int]] = {}

# Thread safety
_cache_lock = threading.RLock()


def get_template_fields_for_section(db: DBSession, section_id: int) -> Dict[int, FormTemplateField]:
    """Get all template fields for a section with global caching."""
    with _cache_lock:
        if section_id in _template_fields_cache:
            return _template_fields_cache[section_id]
    
    fields = (
        db.query(FormTemplateField)
        .filter(FormTemplateField.section_id == section_id)
        .all()
    )
    
    fields_dict = {field.id: field for field in fields}
    
    with _cache_lock:
        _template_fields_cache[section_id] = fields_dict
    
    return fields_dict


def get_field_options(db: DBSession, field_ids: List[int]) -> Dict[int, List[FormTemplateFieldOption]]:
    """Get field options for multiple fields with global caching."""
    results = {}
    uncached_field_ids = []
    
    with _cache_lock:
        for field_id in field_ids:
            if field_id in _field_options_cache:
                results[field_id] = _field_options_cache[field_id]
            else:
                uncached_field_ids.append(field_id)
    
    if uncached_field_ids:
        options = (
            db.query(FormTemplateFieldOption)
            .filter(FormTemplateFieldOption.field_id.in_(uncached_field_ids))
            .all()
        )
        
        options_by_field = defaultdict(list)
        for option in options:
            options_by_field[option.field_id].append(option)
        
        with _cache_lock:
            for field_id in uncached_field_ids:
                field_options = options_by_field[field_id]
                _field_options_cache[field_id] = field_options
                results[field_id] = field_options
    
    return results


def get_section(db: DBSession, section_id: int) -> Optional[FormTemplateSection]:
    """Get section with global caching."""
    with _cache_lock:
        if section_id in _sections_cache:
            return _sections_cache[section_id]
    
    section = db.query(FormTemplateSection).filter(FormTemplateSection.id == section_id).first()
    
    if section:
        with _cache_lock:
            _sections_cache[section_id] = section
    
    return section


def get_template_fields_for_form(db: DBSession, form_id: int) -> Dict[int, FormTemplateField]:
    """Get all template fields for an entire form with global caching."""
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        return {}
    
    form_template_id = form.form_template_id
    
    with _cache_lock:
        if form_template_id in _form_template_sections_cache:
            section_ids = _form_template_sections_cache[form_template_id]
        else:
            sections = (
                db.query(FormTemplateSection)
                .filter(FormTemplateSection.form_template_id == form_template_id)
                .all()
            )
            section_ids = [section.id for section in sections]
            _form_template_sections_cache[form_template_id] = section_ids
    
    all_fields = {}
    for section_id in section_ids:
        section_fields = get_template_fields_for_section(db, section_id)
        all_fields.update(section_fields)
    
    return all_fields


def get_pdf_field_mappings(db: DBSession, form_id: int) -> dict:
    """Generate PDF field mappings using cached template data and ad hoc response queries."""
    # Get cached template fields for the form
    template_fields = get_template_fields_for_form(db, form_id)
    
    # Get field IDs that need options
    select_field_ids = [
        field_id for field_id, field in template_fields.items()
        if field.type in [FormTemplateFieldTypes.SELECT_ONE, FormTemplateFieldTypes.SELECT_MANY]
    ]
    
    # Get cached field options
    options_by_field = get_field_options(db, select_field_ids) if select_field_ids else {}
    
    # Build PDF field mappings by querying responses ad hoc for each field
    mappings = {}
    
    for field_id, template_field in template_fields.items():
        if not template_field.should_fill_on_form:
            continue
            
        # Query response ad hoc for this specific field
        response = (
            db.query(FormFieldResponse)
            .filter(
                FormFieldResponse.form_id == form_id,
                FormFieldResponse.form_template_field_id == field_id
            )
            .first()
        )
        
        if not response:
            continue
        
        if template_field.type == FormTemplateFieldTypes.SELECT_ONE:
            field_options = options_by_field.get(template_field.id, [])
            for option in field_options:
                if str(option.id) == str(response.value):
                    mappings[option.pdf_field_name] = "/Y"
                else:
                    mappings[option.pdf_field_name] = "/Off"
        elif template_field.type == FormTemplateFieldTypes.SELECT_MANY:
            pass  # TODO
        else:
            if template_field.pdf_field_name:
                mappings[template_field.pdf_field_name] = response.value
    
    return mappings


def get_section_template_data(db: DBSession, section_id: int) -> dict:
    """Get complete section template data (fields + options) with caching."""
    section = get_section(db, section_id)
    if not section:
        return {'section': None, 'fields': {}, 'options': {}}
    
    fields = get_template_fields_for_section(db, section_id)
    field_ids = list(fields.keys())
    options = get_field_options(db, field_ids) if field_ids else {}
    
    return {
        'section': section,
        'fields': fields,
        'options': options
    }

def get_cache_stats() -> dict:
    """Get cache statistics for monitoring."""
    with _cache_lock:
        return {
            'template_fields_sections_cached': len(_template_fields_cache),
            'total_template_fields_cached': sum(len(fields) for fields in _template_fields_cache.values()),
            'field_options_cached': len(_field_options_cache),
            'sections_cached': len(_sections_cache),
            'form_templates_cached': len(_form_template_sections_cache),
        }


def clear_cache():
    """Clear all cached data."""
    with _cache_lock:
        _template_fields_cache.clear()
        _field_options_cache.clear()
        _sections_cache.clear()
        _form_template_sections_cache.clear()


def warmup_cache(db: DBSession, form_template_ids: List[int] = None):
    """Pre-populate cache with form template data."""
    if form_template_ids is None:
        from app.models import FormTemplate
        form_templates = db.query(FormTemplate).all()
        form_template_ids = [ft.id for ft in form_templates]
    
    for form_template_id in form_template_ids:
        try:
            sections = (
                db.query(FormTemplateSection)
                .filter(FormTemplateSection.form_template_id == form_template_id)
                .all()
            )
            
            section_ids = [section.id for section in sections]
            
            with _cache_lock:
                _form_template_sections_cache[form_template_id] = section_ids
                for section in sections:
                    _sections_cache[section.id] = section
            
            # Load template fields for each section
            all_field_ids = []
            for section_id in section_ids:
                fields = get_template_fields_for_section(db, section_id)
                all_field_ids.extend(fields.keys())
            
            # Load field options
            if all_field_ids:
                get_field_options(db, all_field_ids)
                
        except Exception:
            continue