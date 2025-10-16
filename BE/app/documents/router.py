from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from app.auth.service import get_project_state
from app.models import ProjectState
from app.schemas import DocumentPublic, DocumentsPublic, DocumentTypesPublic
from app.documents import service as document_service
import io

router = APIRouter()


@router.get("", response_model=DocumentsPublic)
async def list_documents(project_state: ProjectState = Depends(get_project_state)):
    """Get all documents for a project"""
    try:
        documents = await document_service.list_for_project(
            db=project_state.db, project=project_state.project
        )
        return DocumentsPublic(documents=documents)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve documents: {str(e)}"
        )


@router.get("/types", response_model=DocumentTypesPublic)
async def get_document_types(project_state: ProjectState = Depends(get_project_state)):
    """Get all available document types"""
    try:
        types = await document_service.get_document_types(db=project_state.db)
        return DocumentTypesPublic(types=types)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve document types: {str(e)}"
        )


@router.get("/{document_uuid}")
async def download_document(
    document_uuid: str, project_state: ProjectState = Depends(get_project_state)
):
    """Stream document blob content"""
    try:
        # Get document from database
        document = await document_service.get_by_public_id(
            db=project_state.db,
            project=project_state.project,
            document_uuid=document_uuid,
        )

        if not document:
            raise HTTPException(
                status_code=404, detail="Document not found in this project"
            )

        # Get file bytes from storage
        file_bytes = await document_service.get_document_blob(
            document=document, project=project_state.project
        )

        # Create a streaming response
        async def stream_content():
            """Stream file in chunks"""
            chunk_size = 8192  # 8KB chunks
            file_stream = io.BytesIO(file_bytes)

            while chunk := file_stream.read(chunk_size):
                yield chunk

        # Return streaming response with appropriate headers
        return StreamingResponse(
            stream_content(),
            media_type=document.content_type or "application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{document.name}"',
                "Content-Length": str(len(file_bytes)),
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve file: {str(e)}"
        )


@router.post("", response_model=DocumentPublic)
async def create_document(
    file: UploadFile, project_state: ProjectState = Depends(get_project_state)
):
    """Create a new document"""
    try:
        document = await document_service.create(
            db=project_state.db, project=project_state.project, file=file
        )
        return document
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")
