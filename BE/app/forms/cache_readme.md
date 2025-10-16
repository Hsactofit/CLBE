````markdown
# Form Template Caching Implementation

## Problem
The forms module had **N+1 database query performance issues** where template field data was queried repeatedly for every request, causing poor performance.

## Solution
Implemented **global application-level caching** for form template data while keeping response data always fresh from the database.

---

## What is Cached
- `FormTemplateField` (field definitions)  
- `FormTemplateFieldOption` (dropdown options)  
- `FormTemplateSection` (section structure)  

## What is NOT Cached
- `FormFieldResponse` (user data – always queried fresh)  

---

## How It Works

### Cache Scope
- Global in-memory cache shared across all users  
- Persists until backend restart  
- Thread-safe with locks  

### Cache Storage
```python
_template_fields_cache: Dict[section_id, Dict[field_id, FormTemplateField]]
_field_options_cache: Dict[field_id, List[FormTemplateFieldOption]]
_sections_cache: Dict[section_id, FormTemplateSection]
````

### Data Flow

1. First request for a section loads template data to cache
2. Subsequent requests use cached template data
3. Response data always queried individually from database

---

## Performance Impact

* **Before**: `1 + N` database queries (N = number of fields/responses)
* **After**: `3` queries total regardless of data size
* Template structure reused across all users globally

---

## Implementation

### Cache Functions (`app/forms/cache.py`)

* `get_template_fields_for_section()` → Cache template fields
* `get_field_options()` → Cache field options
* `get_section_template_data()` → Get complete cached section data

### Service Changes (`app/forms/service.py`)

* `get_section_fields()` → Uses cached template data + ad hoc response queries
* `submit_section_responses()` → Uses cached template lookups instead of individual queries

---

## Example

### Before (inefficient)

```python
for response in responses:
    template_field = db.query(FormTemplateField).filter(...).first()  # N queries
```

### After (cached)

```python
template_fields = cache.get_template_fields_for_section(db, section_id)  # 1 query
for response in responses:
    template_field = template_fields[response.form_template_field_id]  # Memory lookup
```

---

## User Experience

* **User A** loads form: Template cached globally, gets own responses
* **User B** loads same form: Uses cached template, gets own fresh responses
* **User A** updates responses: Template stays cached, new responses saved to DB
* All users benefit from faster template loading

---

## Cache Invalidation

* Cache is cleared only on backend restart
* No automatic invalidation since template data **rarely changes**
