from pypdf import PdfReader, PdfWriter
from app.documents.storage import storage
from sqlalchemy.orm import Session as DBSession
from app.models import (
    FormFieldResponse,
    FormTemplateField,
    FormTemplate,
    FormTemplateFieldTypes,
)

# from app.documents.storage import storage
import io
import asyncio


class PDFFormFiller:
    def __init__(self, pdf_input_path, pdf_output_path):
        """
        Initialize the PDF form filler.
        Args:
            pdf_input_path (str): Path to the input PDF file.
            pdf_output_path (str): Path to the output PDF file.
        """
        self.input_path = pdf_input_path
        self.output_path = pdf_output_path

    async def fill_pdf(self, form_id, db: DBSession):
        """
        Main entry to fill the PDF form.
        Args:
            form_id (int): Form ID.
        Process:
            1. Get field-value mapping.
            2. Call fill method to fill the PDF.
        """
        pair = get_field_value_pair(db, form_id)
        print(f"pair: {pair}")
        await self._fill(pair)

    async def _fill(self, pair, *args, **kwargs):
        """
        Fill the PDF form (should be implemented in subclasses).
        Args:
            pair (dict): {pdf_field_name: value} Mapping of field names to values.
        Raises:
            NotImplementedError: Must be implemented in subclasses.
        """
        raise NotImplementedError("implement this functuionin in subclasses")


class AcroFormFiller(PDFFormFiller):
    async def _fill(self, pair):
        """
        Fill an AcroForm-type PDF form using annotation traversal.
        Args:
            pair (dict): {pdf_field_name: value} Mapping of field names to values.
        """
        reader = PdfReader(self.input_path)
        writer = PdfWriter()
        writer.append(reader)

        filled_count = 0

        # Traverse all pages and annotations
        for page_idx, page in enumerate(reader.pages):
            if "/Annots" in page:
                for annot in page["/Annots"]:
                    try:
                        annot_obj = annot.get_object()
                        field_name = annot_obj.get("/T", None)
                        field_type = annot_obj.get("/Subtype", "Unknown")

                        # Skip non-widget annotations
                        if field_type != "/Widget":
                            continue

                        # For now, we don't need to get from parent. Can be added later.
                        # If no field name, try to get from parent
                        # if not field_name:
                        #     parent = annot_obj.get("/Parent")
                        #     if parent:
                        #         parent_obj = parent.get_object()
                        #         field_name = parent_obj.get("/T", None)

                        if not field_name:
                            continue

                        # Check if we have a value for this field
                        if field_name in pair:
                            value = pair[field_name]
                            try:
                                writer.update_page_form_field_values(
                                    writer.pages[page_idx],
                                    {field_name: value},
                                    auto_regenerate=False,
                                )
                                print(f"Filled field: {field_name} = {value}")
                                filled_count += 1
                            except Exception as e:
                                print(f"Failed to fill field {field_name}: {e}")
                        else:
                            # Try fuzzy matching for fields without [0] suffix
                            base_name = field_name.replace("[0]", "")
                            if base_name in pair:
                                value = pair[base_name]
                                try:
                                    writer.update_page_form_field_values(
                                        writer.pages[page_idx],
                                        {field_name: value},
                                        auto_regenerate=False,
                                    )
                                    print(
                                        f"Filled field (fuzzy): {field_name} = {value} (matched {base_name})"
                                    )
                                    filled_count += 1
                                except Exception as e:
                                    print(f"Failed to fill field {field_name}: {e}")

                    except Exception as e:
                        print(f"Error processing annotation: {e}")
                        continue

        print(f"Total fields filled: {filled_count}")

        # Save
        pdf_bytes = io.BytesIO()
        writer.write(pdf_bytes)
        pdf_bytes.seek(0)

        # save to storage
        await storage.save_file(pdf_bytes.read(), self.output_path)


class XFAFormFiller(PDFFormFiller):
    async def _fill(self, pair, xml_file_path=None):
        """
        Fill an XFA-type PDF form.
        Args:
            pair (dict): {pdf_field_name: value} Mapping of field names to values.
            responses: List of database responses.
            id_to_pdf_field: Mapping from field id to PDF field name.
            s3_bucket (str): S3 bucket name.
            s3_key (str): S3 file key.
        Process:
            1. Download XML from S3.
            2. Use BeautifulSoup to modify XML fields.
            3. Write back to PDF.
        """
        import pikepdf
        from bs4 import BeautifulSoup
        import os
        from app.forms.pdf.xfaTools import XfaObj

        if xml_file_path is None:
            xml_file_path = os.path.join(
                os.path.dirname(__file__), "i-129_template", "datasets.xml"
            )
        with open(xml_file_path, "r", encoding="utf-8") as f:
            xml_str = f.read()

        with pikepdf.open(self.input_path, allow_overwriting_input=True) as pdf:
            # check if file is xfa
            acro = pdf.Root.get("/AcroForm")
            if not acro or not acro.get("/XFA"):
                raise ValueError(f"{self.input_path} is not an XFA PDF")

            # 2. use BeautifulSoup to modify XML
            soup = BeautifulSoup(xml_str, "xml")
            for pdf_field, value in pair.items():
                if value is not None:
                    tag = soup.find(pdf_field)
                    if tag:
                        tag.string = str(value)
            new_xml = str(soup)

            xfa = XfaObj(pdf)
            # write back to pdf (from xfa)
            xfa["datasets"] = new_xml
            if os.path.exists(self.output_path):
                os.remove(self.output_path)
            pdf.save(self.output_path)
        print(f"XFA PDF filled and saved to {self.output_path}")


def get_field_value_pair(db: DBSession, form_id):
    """
    Get all field-value pairs for the given form_id.
    Args:
        db (Session): Database session.
        form_id (int): Form ID.
    Returns:
        dict: {pdf_field_name: value} Mapping from PDF field name to value.
    """
    # 1. get all responses from that form_id
    responses = (
        db.query(FormFieldResponse).filter(FormFieldResponse.form_id == form_id).all()
    )
    mappings = {}
    # 2. get all these responses fill into pdf
    for r in responses:
        # find template field for each response
        template_field = (
            db.query(FormTemplateField)
            .filter(FormTemplateField.id == r.form_template_field_id)
            .first()
        )

        if template_field and template_field.should_fill_on_form:
            # select one
            if template_field.type == FormTemplateFieldTypes.SELECT_ONE:
                for o in template_field.options:
                    if str(o.id) == str(r.value):
                        mappings[o.pdf_field_name] = "/Y"
                    else:
                        mappings[o.pdf_field_name] = "/Off"
            # TODO: SELECT_MANY logic (future)
            if template_field.type == FormTemplateFieldTypes.SELECT_MANY:
                pass
            else:
                if template_field.pdf_field_name:
                    mappings[template_field.pdf_field_name] = r.value
    return mappings


def print_pdf_form_fields(reader: PdfReader):
    """
    Print all form fields in a PDF file.
    Args:
        reader (PdfReader): PdfReader object.
    """
    try:
        field_count = 0
        for page_idx, page in enumerate(reader.pages):
            if "/Annots" in page:
                print(f"Page {page_idx + 1} annotations:")
                for annot in page["/Annots"]:
                    try:
                        annot_obj = annot.get_object()
                        field_name = annot_obj.get("/T", None)
                        field_type = annot_obj.get("/Subtype", "Unknown")

                        if field_name:
                            field_count += 1
                            print(
                                f"  {field_count:3d}. {field_name} (Type: {field_type})"
                            )
                        else:
                            # Check if it's a widget annotation
                            if field_type == "/Widget":
                                parent = annot_obj.get("/Parent")
                                if parent:
                                    parent_obj = parent.get_object()
                                    parent_name = parent_obj.get("/T", None)
                                    if parent_name:
                                        field_count += 1
                                        print(
                                            f"  {field_count:3d}. {parent_name} (Type: Widget, Parent)"
                                        )
                    except Exception as e:
                        print(f"    Error processing annotation: {e}")

        print(f"\nTotal fields found: {field_count}")

    except Exception as e:
        print(f"Error reading PDF: {e}")


async def main():
    input_pdf = "/Users/xiangyuguan/Documents/summer_2025/skiplegal/backend/app/forms/pdf/i-129_template.pdf"
    output_pdf = "/Users/xiangyuguan/Documents/summer_2025/skiplegal/backend/app/forms/pdf/test_output.pdf"

    filler = XFAFormFiller(input_pdf, output_pdf)
    await filler._fill({"P1Line6_No": "Y", "P1Line6_Yes": ""})


if __name__ == "__main__":
    asyncio.run(main())
