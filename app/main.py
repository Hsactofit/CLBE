from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from app.auth.router import router as users_router, auth_router as auth_router
from app.projects.router import router as projects_router
from app.forms.router import router as forms_router
from app.documents.router import router as documents_router
from app.workflow.router import router as workflow_router
from app.clients.router import router as clients_router
from app.wages.router import router as wages_router

API_VERSION = "0.1.1"

app = FastAPI(title="Crossing Legal AI API", description="", version=API_VERSION)

app.add_middleware(ProxyHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(projects_router, prefix="/projects", tags=["projects"])
app.include_router(
    forms_router, prefix="/projects/{project_public_id}/forms", tags=["forms"]
)
app.include_router(
    documents_router,
    prefix="/projects/{project_public_id}/documents",
    tags=["documents"],
)
app.include_router(
    workflow_router,
    prefix="/projects/{project_public_id}/steps",
    tags=["workflow"],
)
app.include_router(clients_router, prefix="/clients", tags=["clients"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(
    wages_router,
    prefix="/projects/{project_public_id}/wages",
    tags=["wages"],
)


@app.get("/")
async def health_check():
    return {"version": API_VERSION, "message": "OK"}
