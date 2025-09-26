# PDF Form Filling Documentation

This directory contains utilities and documentation for filling PDF forms programmatically.

## PDF Form Types

There are two main types of fillable PDF forms:

### 1. AcroForms (Traditional PDF Forms)

- Standard PDF forms with form fields embedded in the PDF
- Fields have specific names and export values
- Can be filled using libraries like `pdftk`, `PyPDF2`, or `fitz`
- More predictable field behavior

### 2. XFA Forms (XML Forms Architecture)

- Dynamic forms based on XML
- More complex layout and interactive features
- Requires specialized handling
- Can be converted to AcroForms for simpler processing

## Current Implementation Status

### I-129 Form Issue

**Problem**: The I-129 PDF form mysteriously converts to AcroForm format after filling, even when originally in a different format.

**Current Solution**: We are using the AcroForm filling method specifically for I-129 to handle this conversion gracefully.

**Code Implementation**:

```python
# Special handling for I-129
if form_name == 'I-129':
    # Use AcroForm method due to automatic conversion
    filled_pdf = fill_acroform(pdf_path, field_data)
else:
    # Try standard method first, fall back to AcroForm if needed
    filled_pdf = fill_pdf_form(pdf_path, field_data)
```
