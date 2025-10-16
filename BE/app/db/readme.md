# Form Template Database Setup

This directory contains the database schema and seed data for form templates.

## Database Structure

The form template system consists of four main tables:

- `form_template`: Main form information
- `form_template_section`: Logical sections within a form
- `form_template_field`: Individual fields within sections
- `form_template_field_option`: Available options for SELECT_ONE/SELECT_MULTIPLE fields

## Adobe Acrobat Form Field Analysis

### How to View Form Fields in Adobe Acrobat

1. **Open the PDF form** in Adobe Acrobat Pro
2. **Use Prepare Form Tool**:
   - Click on `Tools` → `Prepare Form`
   - Or go to `All tools` → `Forms & Signatures` → `Prepare Form`
3. **Acrobat will automatically detect form fields**:
   - If fields aren't detected, click `Start` and Acrobat will analyze the document
   - All form fields will be highlighted with blue boxes
4. **Inspect Individual Fields**:
   - Click on any form field to select it
   - Right-click and select `Properties` for detailed settings
   - In Properties dialog:
     - `General` tab shows the field name (this is what you need for mapping)
     - `Options` tab shows available values for checkboxes/radio buttons
     - `Format` tab shows data type and validation rules
5. **View Field Names**:
   - Each field shows its name when selected
   - Field names are case-sensitive and must match exactly in code

### Alternative Method: Fields Panel

1. **Open Fields Panel**:
   - Go to `View` → `Show/Hide` → `Navigation Panes` → `Fields`
   - This shows a hierarchical list of all form fields
2. **Field Properties**:
   - Right-click any field in the panel → `Properties`
   - Shows same information as the Prepare Form method

### Common Field Types Found in I-129

- **Text Fields**: `Line1_FamilyName[0]`, `Line2_GivenName[0]`
- **Checkboxes**: `P1Line6_Yes[0]`, `P1Line6_No[0]` (values: `/Y`/`/Off`)
- **Radio Buttons**: `Line3_Unit[0]`, `Line3_Unit[1]`, `Line3_Unit[2]` (values: `STE`, `APT`, `FLR`)
- **Date Fields**: `Line4a_DateofBirth[0]` (format: MM/DD/YYYY, but as `TEXT`)

## Current PDF Field Value Issues

### Problem with Default Values

Adobe forms use specific export values:

- Checkboxes: `/Y` and `/Off` (or similar)
- Radio buttons: Each option has a unique export value
- These values are NOT human-readable

### Example of Current Mapping Issues

```sql
-- What we currently have (human-readable):
('P1Line6_Yes[0]', 'Individual')
('P1Line6_No[0]', 'Company or Organization')

-- What Adobe PDF actually expects:
('P1Line6_Yes[0]', '/Y')  -- When Individual is selected
('P1Line6_No[0]', '/Y')   -- When Company is selected
```

## Next Steps & Improvements

### 1. Fix PDF Field Value Mapping

**Create proper export value mapping**:

```sql
-- Add export_value column to store PDF-compatible values
ALTER TABLE form_template_field_option
ADD COLUMN export_value VARCHAR(255);

-- Update with correct export values
UPDATE form_template_field_option
SET export_value = 'Yes'
WHERE pdf_field_name = 'P1Line6_Yes[0]' AND alternative_text = 'Individual';

UPDATE form_template_field_option
SET export_value = 'Off'
WHERE pdf_field_name = 'P1Line6_Yes[0]' AND alternative_text = 'Company or Organization';
```

### 2. Implement Two-Level Value System

**Database stores human-readable values, PDF generation uses export values**:

```python
# Example mapping for PDF generation
def get_pdf_field_value(field_name, human_value):
    mapping = {
        'P1Line6_Yes[0]': {
            'Individual': 'Yes',
            'Company or Organization': 'Off'
        },
        'P1Line6_No[0]': {
            'Individual': 'Off',
            'Company or Organization': 'Yes'
        }
    }
    return mapping.get(field_name, {}).get(human_value, 'Off')
```

### 3. Add Default Selection Logic

```sql
ALTER TABLE form_template_field_option
ADD COLUMN is_default BOOLEAN DEFAULT FALSE;

ALTER TABLE form_template_field_option
ADD COLUMN display_order INTEGER DEFAULT 0;
```

### 4. Validation and Constraints

```sql
ALTER TABLE form_template_field
ADD COLUMN field_format VARCHAR(50);  -- 'date', 'ssn', 'phone', etc.
ADD COLUMN max_length INTEGER;
ADD COLUMN is_required BOOLEAN DEFAULT FALSE;
```

## Testing PDF Population

### Recommended Testing Process

1. **Use Adobe Acrobat's Prepare Form** to understand field structure
2. **Create test data** with known values
3. **Generate PDF** and verify fields populate correctly
4. **Open in Adobe Reader** to test user experience
5. **Validate field export values** match Adobe's expectations

### Debug PDF Field Issues

If fields don't populate:

1. Check field names match exactly (case-sensitive)
2. Verify export values are correct for the field type
3. Test with Adobe's default values first (`/Y`/`/Off`)
4. Use Adobe's JavaScript console to test field values

## Files in this Directory

- `seed_data_dump.sql`: Primary seed data for USCIS Form I-129 (maps required fields from H1_129_data.txt)
- `readme.md`: This documentation file
- Migration files for database schema updates

## Common Issues & Solutions

### Issue: Checkboxes not checking

**Cause**: Wrong export value (using `true` instead of `\Y`)
**Solution**: Use Adobe Acrobat Prepare Form to find correct export values

### Issue: Radio buttons not selecting

**Cause**: Multiple fields with same name need different export values
**Solution**: Each radio option needs unique export value but same field name

### Issue: Text fields not populating

**Cause**: Field name mismatch or character encoding issues
**Solution**: Copy field names exactly from Adobe Acrobat Properties dialog
