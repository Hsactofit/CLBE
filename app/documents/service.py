from sqlalchemy.orm import Session as DBSession
from app.models import Document, DocumentType, Project
from app.documents.storage import storage
from app.documents.vision_service import vision_service
from fastapi import UploadFile


async def list_for_project(*, db: DBSession, project: Project) -> list[Document]:
    """Get all documents for a project"""
    return db.query(Document).filter(Document.project_id == project.id).all()


async def get_document_types(*, db: DBSession) -> list[DocumentType]:
    """Get all available document types ordered by sequence"""
    return (
        db.query(DocumentType)
        .order_by(DocumentType.sequence.asc(), DocumentType.id.asc())
        .all()
    )


async def get_by_public_id(
    *, db: DBSession, project: Project, document_uuid: str
) -> Document | None:
    """Get document by public ID within a project"""
    return (
        db.query(Document)
        .filter(
            Document.public_id == document_uuid,
            Document.project_id == project.id,
        )
        .first()
    )


async def get_document_blob(*, document: Document, project: Project) -> bytes:
    """Get document blob from storage"""
    file_path = f"documents/{project.client.public_id}/{project.public_id}/uploads/{document.public_id}"

    try:
        return await storage.get_file(file_path)
    except Exception:
        raise


async def create(*, db: DBSession, project: Project, file: UploadFile) -> Document:
    """Create a new document with file upload and vision processing"""
    if not file.filename:
        raise ValueError("File name is required")
    if not file.content_type:
        raise ValueError("File content type is required")

    # Step 1: Create document in database
    try:
        document = Document(
            project_id=project.id, name=file.filename, content_type=file.content_type
        )
        db.add(document)
        db.commit()
        db.refresh(document)
    except Exception:
        db.rollback()
        raise

    # Step 2: Save file to storage
    try:
        file_bytes = await file.read()
        file_path = f"documents/{project.client.public_id}/{project.public_id}/uploads/{document.public_id}"
        await storage.save_file(file_bytes, file_path)
    except Exception:
        # Cleanup: delete the document record since file save failed
        try:
            db.delete(document)
            db.commit()
        except Exception:
            db.rollback()
        raise

    # Step 3: Process with Vision Service
    try:
        await file.seek(0)
        processing_result = await vision_service.send_document(file=file, timeout=30.0)

        # Update document with processing result
        inferred_type_name = processing_result.get("inferred_type")
        if inferred_type_name:
            # Upsert DocumentType by name
            doc_type = (
                db.query(DocumentType)
                .filter(DocumentType.code == inferred_type_name)
                .first()
            )
            if not doc_type:
                doc_type = DocumentType(
                    name=inferred_type_name, code=inferred_type_name
                )
                db.add(doc_type)
                db.flush()
            document.inferred_type_id = doc_type.id

        document.extracted_data = processing_result.get("extracted_data")
        db.commit()
        db.refresh(document)

        print(f"Document processing result: {processing_result}")
    except Exception as vision_error:
        db.rollback()
        print(f"Error during document processing: {str(vision_error)}")
        # Don't raise exception - document is still valid without processing

    return document
