from sqlalchemy.orm import Session as DBSession
from app.models import Document, DocumentType, Project
from app.documents.storage import storage
from app.documents.vision_service import vision_service
from fastapi import UploadFile
import logging

logger = logging.getLogger("uvicorn.error")


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

    logger.info(f"Creating document: {file.filename} for project {project.id}")

    # Step 1: Create document in database
    try:
        document = Document(
            project_id=project.id, name=file.filename, content_type=file.content_type
        )
        db.add(document)
        db.commit()
        db.refresh(document)
        logger.info(
            f"Document created with ID: {document.id}, public_id: {document.public_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create document record: {e}")
        raise

    # Step 2: Save file to storage
    try:
        file_bytes = await file.read()
        file_path = f"documents/{project.client.public_id}/{project.public_id}/uploads/{document.public_id}"
        await storage.save_file(file_bytes, file_path)
        logger.info(f"File saved to storage: {file_path}")
    except Exception as e:
        # Cleanup: delete the document record since file save failed
        logger.error(f"Failed to save file to storage: {e}")
        try:
            db.delete(document)
            db.commit()
        except Exception as cleanup_error:
            logger.error(f"Failed to cleanup document record: {cleanup_error}")
            db.rollback()
        raise

    # Step 3: Process with Vision Service
    try:
        await file.seek(0)
        logger.info("Sending document to vision service for processing")
        processing_result = await vision_service.send_document(file=file, timeout=30.0)
        logger.info(f"Vision service processing result: {processing_result}")

        # Update document with processing result
        inferred_type_name = processing_result.get("inferred_type")
        if inferred_type_name:
            # Upsert DocumentType by code
            doc_type = (
                db.query(DocumentType)
                .filter(DocumentType.code == inferred_type_name)
                .first()
            )
            if not doc_type:
                logger.warning(
                    f"Document type not found for code: {inferred_type_name}, creating new one")
                doc_type = DocumentType(
                    name=inferred_type_name, code=inferred_type_name
                )
                db.add(doc_type)
                db.flush()

            document.inferred_type_id = doc_type.id
            logger.info(
                f"Document type set to: {doc_type.name} (ID: {doc_type.id})")

        extracted_data = processing_result.get("extracted_data")
        if extracted_data:
            document.extracted_data = extracted_data
            logger.info("Extracted data saved to document")

        db.commit()
        db.refresh(document)
        logger.info(
            f"Document processing complete. Type ID: {document.inferred_type_id}")

    except Exception as vision_error:
        logger.error(f"Vision processing failed: {str(vision_error)}")
        # Don't rollback or raise - document is still valid without processing

    # Save document_id before evaluation (in case session gets rolled back)
    document_id = document.id

    # Step 4: AUTOMATIC WORKFLOW EVALUATION
    logger.info("Triggering workflow evaluation after document upload")
    try:
        from app.workflow.workflow_evaluator import evaluate_workflow_completion
        evaluation_result = await evaluate_workflow_completion(db=db, project=project)
        logger.info(f"Workflow evaluation result: {evaluation_result}")
    except Exception as eval_error:
        logger.error(f"Workflow evaluation failed: {eval_error}")
        # Rollback the failed evaluation transaction
        db.rollback()
        # Re-fetch the document with a fresh query to avoid PendingRollbackError
        document = db.query(Document).filter(
            Document.id == document_id).first()
        if not document:
            logger.error(
                f"Could not re-fetch document {document_id} after evaluation failure")
            raise ValueError(
                f"Document {document_id} not found after workflow evaluation failure")

    return document
