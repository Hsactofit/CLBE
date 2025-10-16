"""
Template Serializer usage example
"""

from app.database import get_db
from app.forms.template_serializer.serializer import SerializerService
from app.forms.template_serializer.utils import save_to_json


def export_form_template():
    """Example: Export form template to JSON"""
    db = next(get_db())

    try:
        # Export form template
        form_template_id = 1
        form_template = SerializerService.export_form_template(db, form_template_id)

        if form_template:
            # Save to file
            file_path = save_to_json(form_template)
            print(f"Form template exported to: {file_path}")
        else:
            print("Form template not found")

    finally:
        db.close()


if __name__ == "__main__":
    print("Template Serializer Usage Example")
    print("=" * 40)

    # Run the example
    export_form_template()

    print("\nExample completed. Check the 'exports' directory for generated JSON file.")
