from sqlalchemy.orm import Session
from app.models import (
    FormFieldResponse,
    FormTemplateField,
    FormTemplate,
    FormTemplateFieldTypes,
)
from app.database import SessionLocal
from sqlalchemy.orm import Session as DBSession
import re


def check_dependency(expression: str, db: Session, form_id: int):
    """_summary_

    Args:
        expression (str): _description_
        form_id (int): _description_
        db (Session): _description_
    """
    # if no dependency expression
    if not expression:
        return True

    # parse expression
    field_pattern = r"\{([^}]+)\}"
    field_references = re.findall(field_pattern, expression)

    # find value
    field_values = {}
    for field_ref in field_references:
        value = get_field_value(field_ref, db, form_id)
        converted_value = convert_string_to_proper_type(value)
        field_values[field_ref] = converted_value

    # trun result into real value
    processed_expression = expression
    for field_ref, value in field_values.items():
        if isinstance(value, str):
            escaped_value = f"'{value}'"
        elif value is None:
            escaped_value = "None"
        elif isinstance(value, (int, float)):
            escaped_value = str(value)
        elif isinstance(value, bool):
            escaped_value = str(value)
        else:
            escaped_value = f"'{str(value)}'"

        # we got "user result pairing target result time"
        processed_expression = processed_expression.replace(
            f"{{{field_ref}}}", escaped_value
        )
        # print(processed_expression)
    return evaluate_dependency_safe(processed_expression)


def get_field_value(field_key, db: Session, form_id):
    try:
        response = (
            db.query(FormFieldResponse)
            .filter(FormFieldResponse.form_id == form_id)
            .filter(FormFieldResponse.form_template_field.has(key=field_key))
            .first()
        )
        print(field_key, form_id)
        if response:
            print("got", response)
            return response.value
        return None
    except Exception as e:
        print(f"Error getting field value for '{field_key}': {e}")
        return None


def evaluate_dependency_safe(expression: str):
    # set limited functions to avoid maticulous inputs
    allowed_names = {
        "__builtins__": {},
        "True": True,
        "False": False,
        "None": None,
        "true": True,
        "false": False,
        "null": None,
        "Yes": True,
        "No": False,
    }

    try:
        safe_expression = expression
        # for yes/no
        safe_expression = safe_expression.replace("'Yes'", "True")
        safe_expression = safe_expression.replace("'No'", "False")

        # logic
        safe_expression = safe_expression.replace("||", " or ")
        safe_expression = safe_expression.replace("&&", " and ")

        # replace
        safe_expression = safe_expression.replace(">=", "___GTE___")
        safe_expression = safe_expression.replace("<=", "___LTE___")
        safe_expression = safe_expression.replace("!=", "___NE___")
        safe_expression = safe_expression.replace("==", "___EQ___")

        # signle operator
        safe_expression = safe_expression.replace(">", " > ")
        safe_expression = safe_expression.replace("<", " < ")

        # replace back
        safe_expression = safe_expression.replace("___GTE___", " >= ")
        safe_expression = safe_expression.replace("___LTE___", " <= ")
        safe_expression = safe_expression.replace("___NE___", " != ")
        safe_expression = safe_expression.replace("___EQ___", " == ")

        # evaluate
        result = eval(safe_expression, {"__builtins__": {}}, allowed_names)
        return bool(result)
    except Exception as e:
        print(f"Error evaluating safe expression: {e}")
        return False


def convert_string_to_proper_type(value):
    """
    convert string to proper type
    """
    if value is None:
        return None

    value_str = str(value).strip()

    # empty
    if not value_str:
        return None

    # bool
    if value_str.lower() in ["true", "yes", "1", "Yes"]:
        return True
    elif value_str.lower() in ["false", "no", "0", "No"]:
        return False

    # number
    try:
        # int
        if "." not in value_str and "e" not in value_str.lower():
            return int(value_str)
        else:
            # float
            return float(value_str)
    except ValueError:
        pass

    # float
    return value_str


def get_dependency_target(section_id: int, db: DBSession):
    fields = (
        db.query(FormTemplateField)
        .filter(FormTemplateField.section_id == section_id)
        .filter(FormTemplateField.dependency_expression.isnot(None))
        .all()
    )
    print(fields)
    target = set()
    for field in fields:
        field_pattern = r"\{([^}]+)\}"
        field_references = re.findall(field_pattern, field.dependency_expression)
        target.update(field_references)
    return target


if __name__ == "__main__":
    db = SessionLocal()
    templates = db.query(FormTemplateField).all()
    for template in templates:
        expression = template.dependency_expression
        if expression is not None:
            print(check_dependency(expression, db, 2))
