# Service Guide

This guide clarifies the roles of `router.py` (HTTP layer) and `service.py` (DB logic). References: [fastapi-best-practice](https://github.com/zhanymkanov/fastapi-best-practices), [netflix-dispatch](https://github.com/Netflix/dispatch/tree/main/src/dispatch) and [fastapi-backend-template](https://github.com/Aeternalis-Ingenium/FastAPI-Backend-Template).

## Overview
- **Router thin, Service does work.** Router = HTTP I/O + deps + status codes; Service = DB + transactions + business.
- **Function-style services.** Import with aliases: `from app.clients import service as client_service`.
- **Function signatures:** `async def func(*, db: DBSession, ...)` - `*` enforces keyword-only args, `DBSession` type.
- **Modern type hints:** Use `list[T]`, `T | None`, `dict[str, Any]` (Python 3.9+ syntax).
- **Names:**
  - Router: `list_*`, `get_*`, `create_*`, `update_*`, `delete_*`,`download_*`...
  - Service: `create`, `get_by_id`, `get_by_public_id`, `list_for_project`, `update`, `delete`, `generate_pdf_bytes`, `submit_section_responses`.
- **Dependency Chain:** `current_user_id` → `get_project_state` → pass `db/project` into service.
- **Errors:** Service raises **built-ins** (`ValueError`, `FileNotFoundError`…), Router maps to `HTTPException`. Use direct `raise` to preserve stack traces.

---

## Current plan
Each component has **`service.py`** and **`router.py`**. Keep all DB/transaction logic in service **functions**. Routers call them via aliases (`client_service`, `form_service`, `project_service`).

**Service examples**
```python
# Import DBSession type
from sqlalchemy.orm import Session as DBSession

# clients/service.py
async def create(*, db: DBSession, clerk_user_id: str, data): ...
async def list_by_user(*, db: DBSession, user_id: str): ...

# forms/service.py
async def list_for_project(*, db: DBSession, project: Project) -> list[FormPublic]: ...
async def get_by_public_id(*, db: DBSession, project: Project, public_id: uuid.UUID) -> Form | None: ...
async def submit_section_responses(*, db: DBSession, form: Form, section: FormTemplateSection, responses: dict): ...
async def generate_pdf_bytes(*, db: DBSession, project: Project, form_public_id: uuid.UUID) -> bytes: ...
```

**Router usage**
```python
# documents/router.py
from app.documents import service as document_service

@router.get("", response_model=DocumentsPublic)
async def list_documents(project_state: ProjectState = Depends(get_project_state)):
    """Get all documents for a project"""
    try:
        documents = await document_service.list_for_project(
            db=project_state.db, project=project_state.project
        )
        return DocumentsPublic(documents=documents)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve documents: {str(e)}")
```

**Transactions in service**
```python
async def create(*, db: DBSession, clerk_user_id: str, data):
    try:
        # Step 1: Create entity
        entity = Entity(...)
        db.add(entity)
        db.commit()
        db.refresh(entity)
        return entity
    except Exception:
        db.rollback()
        raise  # Direct raise preserves original exception
```

---

## Post-MVP Plan
**Repository Class:** When CRUD patterns repeat and we want reuse, add a **Repository** layer to abstract db operations. Create a generic base and per-entity repos (e.g., `UserRepository`, `ClientRepository`, `FormRepository`). **Service still owns transactions**; repos do **not** commit/rollback.

**Generic base (example)**
```python
# repositories/base.py
T = TypeVar("T")
class BaseRepository(Generic[T]):
    def __init__(self, db: Session, model: type[T]):
        self.db, self.model = db, model
    def get(self, id: int) -> T | None: return self.db.get(self.model, id)
    def add(self, obj: T) -> T: self.db.add(obj); return obj
    def list(self) -> Sequence[T]: return self.db.execute(select(self.model)).scalars().all()
```
**Per-entity repos (naming & usage)**
Use one repo per entity (file: `app/<entity>/repository.py`). Name it `<Entity>Repository` and add entity-specific queries. Import in service and keep transactions in service.

```python
# repositories/forms.py
class FormRepository(BaseRepository[Form]):
    def __init__(self, db): super().__init__(db, Form)
    def list_for_project(self, project_id: int) -> list[Form]:
        return self.db.query(Form).filter(Form.project_id == project_id).all()

# service usage
from app.clients.repository import ClientRepository
from app.forms.repository import FormRepository
clients = ClientRepository(db); forms = FormRepository(db)
client = clients.get_by_public_id(pub_id) or clients.add(Client(...))
project_forms = forms.list_for_project(project.id)
```

> Start simple (service functions). Introduce repos only when duplication/abstraction pays off.
