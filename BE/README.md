# Backend Development Plan

## System Architecture

### Base Framework

- **FastAPI**: Our backend is built on FastAPI with `main.py` as the application entry point.

- **uv**: Python package management. [uv Install Guide](https://docs.astral.sh/uv/getting-started/installation/)

  ```bash
  # Install dependencies
  uv sync
  # add packages
  uv add <package_name>
  ```

- **ORM**: Database operations through **SQLAlchemy** ORM connecting to **PostgreSQL**, with **Alembic** for migrations.

- **Deployment**:
  - **Back-end**: Built in **Docker** with Dockerfile and Docker Compose YML running in EC2 instance.
  - **SQL database**: Will run on **AWS RDS**. This PostgreSQL database serves as the central source of truth, managing all form templates, field mappings, user responses, user management, and document management systems.
  - **Documents**: Will be stored in **AWS S3** with the following directory structure:
    ```
    documents/
    ├── client_id_1/
    │   ├── client_documents/
    │   │   ├── document1.pdf
    │   │   └── document2.pdf
    │   └── projects/
    │       ├── project_id_1/
    │       │   ├── uploaded/
    │       │   ├── output/
    │       │   └── processing/
    │       └── project_id_2/
    │           ├── uploaded/
    │           ├── output/
    │           └── processing/
    └── client_id_2/
        ├── client_documents/
        └── projects/
    ```
  - **LLM**: Local LLM such as Ollama will run on a separate EC2 instance.
  - **CI/CD**: **GitHub Actions** for continuous integration and deployment.

### APIs

**Users**

- GET `/users/me`: Get current user info

**Clients** (support company related docs)

- GET `/clients/{client_id}`: Get basic information about the client
- POST `/clients/{client_id}`: Create a client
- GET `/clients/{client_id}/documents`: Get client (company) documents
- POST `/clients/{client_id}/documents`: Upload client (company) documents

**Projects**

- GET `/projects`: List all projects
- POST `/projects`: Create new project
- GET `/projects/{project_id}`: Get project status (stages) etc.
- PUT `/projects/{project_id}`: Update project
- DELETE `/projects/{project_id}`: Delete project

**Documents** (under project context)

- GET `/projects/{project_id}/documents`: List uploaded documents
- POST `/projects/{project_id}/documents`: Upload new document, get it verified and OCRed to DB.
- GET `/projects/{project_id}/documents/required`: Get documents required to upload
- GET `/projects/{project_id}/documents/package`: Generate and download complete package for this project

**Forms** (under project context)

- GET `/projects/{project_id}/forms`: List all forms required
- POST `/projects/{project_id}/forms`: Create new form to fill
- GET `/projects/{project_id}/forms/{form_id}/fill`: Extract info from client docs + project docs and fill forms in DB
- GET `/projects/{project_id}/forms/{form_id}/pdf`: Fill PDF form and download

**Chats** (under project context, can create multiple chats)

- GET `/projects/{project_id}/chats/sessions`: List all chat sessions
- POST `/projects/{project_id}/chats/sessions`: Create new chat session
- GET `/projects/{project_id}/chats/sessions/{session_id}/messages`: Get all chat messages under chat session
- POST `/projects/{project_id}/chats/sessions/{session_id}/messages`: Send message in session

### Database Models

1. Use singular form for table name.

2. Each table will have an ID, which is an integer serving as the primary key.

3. Each table will have a public ID, which is a UUID or Clerk user ID for querying and exposing to the public.
4. Project table will have fields about workflow, forms, applicant, client...
5. Chatsession table will have type, context, chat messages...

### Folder Structure

```
backend/
│
├── app/              # Main application package
│   ├── main.py       # FastAPI application entry
│   ├── database.py   # Database connection setup
│   ├── models.py     # SQLAlchemy models
│   ├── schemas.py    # Pydantic schemas
│   │
│   ├── alembic/      # Database migrations
│   │   ├── versions/ # Migration files
│   │   └── env.py    # Alembic configuration
│   │
│   ├── auth/         # Auth management domain
│   │   ├── router.py # User endpoints (/users/*)
│   │   └── service.py # Authentication logic for user state or project state
│   │
│   ├── clients/      # Client management domain
│   │   ├── router.py # Client endpoints (/clients/*)
│   │   └── service.py # Client CRUD operations
│   │
│   ├── projects/     # Project management domain
│   │   ├── router.py # Project endpoints (/projects/*)
│   │   └── service.py # Project CRUD and package generation
│   │
│   ├── documents/    # Document processing domain
│   │   ├── router.py # Document endpoints (/projects/{id}/documents/*)
│   │   ├── service.py # Document CRUD operations
│   │   └── ocr.py    # OCR processing logic
│   │
│   ├── forms/        # Form processing domain
│   │   ├── router.py # Form endpoints (/projects/{id}/forms/*)
│   │   ├── service.py # Form CRUD operations
│   │   ├── pdf.py    # PDF form filling logic (originally fill-pdf.py)
│   │   ├── fill.py   # Extraction documents and fill form in DB/json
│   │   ├── templates/ # PDF and JSON templates
│   │   └── prompts/  # LLM prompts for form processing
│   │
│   └── chats/        # Chat interaction domain
│       ├── router.py # Chat endpoints (/projects/{id}/chats/*)
│       ├── service.py # Chat session management
│       └── utils.py  # Helper functions and formatters
│
├── tests/            # Test files
│
├── alembic.ini       # Alembic configuration (root level)
├── pyproject.toml    # UV project configuration
├── uv.lock           # UV lock file
├── Dockerfile        # Docker configuration
├── docker-compose.yml # Docker Compose configuration
└── README.md         # Project documentation
```

## Technical Discussion Points

### 1. Modular Monolith vs Microservices

While microservices architecture offers benefits like easy scaling and component isolation, it requires significant infrastructure setup - message queues, separate deployments, and distributed database management. Given that we're still exploring how different form types and our new SQL schema will work together, this complexity would slow down our MVP development.

Instead, we'll start with a modular monolith architecture. This approach provides a good balance of modularity and simplicity, making it ideal for our MVP phase. We can consider migrating to microservices once we have a better understanding of our workflow and scaling needs.

### 2. Improved Form SQL Schema

The current JSON-heavy storage will be replaced with a normalized SQL structure implementing proper table relationships and constraints, which will greatly affect fill, pdf and chat components.

- **Fill**: Documents -> DB. Extract documents from the client and project uploaded ones, correct them with right schema, then fill the forms in the database. For LLM to generate corresponding fields, a template should be sent. it can be a JSON based on DB.
- **PDF**: DB -> PDF. Once form field and PDF field mapping is done, we can directly fill pdf based on DB.

The ultimate goal is to use only DB and PDF, and JSON could be the intermediate when necessary. However, for integration and the steps, we may still use the current methods first, and then improve that after it is integrated into our new backend.

### 3. Fill

**<span style="color: orange;">A further meeting is required to discuss this issue in more detail.</span>**

The Fill component is to turn uploaded documents into forms in DB. It will basically separate into two processes:

- Extract documents from the DB, with the metadata and OCRed text content.
- Use those extracted documents to fill the forms in the shape of the template.

Current limitations (Haystack BM25 retriver + correct json pipeline):

- Only top 5 documents are processed.
- Time consuming json correction.

Proposed improvements:

1. Direct LLM Processing

   - Send all OCR-processed documents directly to LLMs. Leverage models with extended context windows
   - Process complete document content without filtering, ensuring no information loss during extraction

2. Agentic Approach
   - Index and embed the uploaded documents in chunks to vector DB.
   - Add a function tool to retrieve documents with query.
   - Let AI agent dynamically select relevant documents (can do function call in multiple times).

### 4. Chats

Chat as a copilot of form filling. Different chat types:

1. Field-specific chat that appears after forms are filled in the frontend, with a chat button for each missing form field
2. Section-based chat that validates user input when filling forms.
3. Document-based chat that answers questions using company documents

### 5. Performance

- LLM calls should use async requests and async functions
- OCR processing should use async requests and async functions
- Database operations can remain synchronous with SQLAlchemy for now **<span style="color: orange;">(Further Research Required)**

### 6. Multi-Tenant

- Keep the configuration in the client component to get the configuration.
- Provide the service accordingly based on configuration for each client.

## Code Formatting

This repository uses [Ruff](https://github.com/astral-sh/ruff) for code formatting. Ruff is a modern Python code formatter that is faster and more powerful than other formatters. This change was made to avoid unneceary changes in files making PRs harder to review. We have not made any custom configuration for Ruff at the moment. This is because the default configuration is already quite good. Its defaults are similar to Black's defaults and it is widely used.

#### Installation

Install from vscode/cursor extension marketplace. There are no special configuration files at the moment. If we deem that custom formatting is necessary, we can create a `.ruff.toml` file to configure it. Simply save a file once the extension is installed to trigger the formatting.
