from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from app.auth.service import get_project_state
from app.models import ProjectState
from app.forms import cache
from app.schemas import (
    FormsPublic,
    SectionsPublic,
    SectionFieldsPublic,
    ResponsesPublic,
)
from app.forms import service as form_service
import uuid
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter()


@router.get("", response_model=FormsPublic)
async def list_forms(project_state: ProjectState = Depends(get_project_state)):
    """Get all forms for a project"""
    try:
        forms = await form_service.list_for_project(
            db=project_state.db, project=project_state.project
        )
        return FormsPublic(forms=forms)
    except Exception as e:
        logger.error(f"Failed to retrieve forms: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve forms: {str(e)}"
        )


@router.get("/{form_public_id}/sections", response_model=SectionsPublic)
async def get_form_sections(
    form_public_id: uuid.UUID, project_state: ProjectState = Depends(get_project_state)
):
    """Get sections for a form"""
    try:
        sections = await form_service.get_form_sections(
            db=project_state.db,
            project=project_state.project,
            form_public_id=form_public_id,
        )
        return SectionsPublic(sections=sections)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to retrieve form sections: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve form sections: {str(e)}"
        )


@router.get(
    "/{form_public_id}/sections/{section_public_id}", response_model=SectionFieldsPublic
)
async def get_section_fields(
    form_public_id: uuid.UUID,
    section_public_id: uuid.UUID,
    project_state: ProjectState = Depends(get_project_state),
):
    """Get fields for a form section with responses and dependency checking"""
    try:
        section_fields = await form_service.get_section_fields(
            db=project_state.db,
            project=project_state.project,
            form_public_id=form_public_id,
            section_public_id=section_public_id,
        )
        return section_fields
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to retrieve section fields: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve section fields: {str(e)}"
        )


@router.post("/{form_public_id}/sections/{section_public_id}")
async def submit_section_responses(
    form_public_id: uuid.UUID,
    section_public_id: uuid.UUID,
    response_request: ResponsesPublic,
    project_state: ProjectState = Depends(get_project_state),
):
    """Submit responses for a form section"""
    try:
        result = await form_service.submit_section_responses(
            db=project_state.db,
            project=project_state.project,
            form_public_id=form_public_id,
            section_public_id=section_public_id,
            response_request=response_request,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to submit section responses: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to submit section responses: {str(e)}"
        )


@router.get("/{form_public_id}/pdf")
async def download_form_pdf(
    form_public_id: uuid.UUID, project_state: ProjectState = Depends(get_project_state)
):
    """Generate and download PDF for a form"""
    try:
        pdf_bytes = await form_service.generate_pdf_bytes(
            db=project_state.db,
            project=project_state.project,
            form_public_id=form_public_id,
        )

        # Return PDF file as Response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=form_{form_public_id}.pdf",
                "Cache-Control": "no-cache, must-revalidate",  # Prevent caching !!Important for refreshing and update
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
    except ValueError as e:
        if "not supported" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to generate form PDF: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate form PDF: {str(e)}"
        )

@router.post("/cache/clear")
async def clear_cache():
    """Clear all form template cache"""
    try:
        stats_before = cache.get_cache_stats()
        cache.clear_cache()
        stats_after = cache.get_cache_stats()
        
        return {
            "message": "Form template cache cleared successfully",
            "stats_before": stats_before,
            "stats_after": stats_after
        }
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.post("/cache/sync")
async def sync_cache():
    """Clear cache and reload from database"""
    try:
        stats_before = cache.get_cache_stats()
        
        # Clear existing cache
        cache.clear_cache()
        
        # Warm cache with all form templates
        from app.database import SessionLocal
        db = SessionLocal()
        try:
            from app.models import FormTemplate
            form_templates = db.query(FormTemplate).all()
            form_template_ids = [ft.id for ft in form_templates]
            
            cache.warmup_cache(db, form_template_ids)
            templates_synced = len(form_template_ids)
        finally:
            db.close()
        
        stats_after = cache.get_cache_stats()
        
        return {
            "message": "Form template cache synced successfully",
            "stats_before": stats_before,
            "stats_after": stats_after,
            "templates_synced": templates_synced
        }
    except Exception as e:
        logger.error(f"Failed to sync cache: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync cache: {str(e)}"
        )


@router.get("/cache/stats")
async def get_cache_stats():
    """Get current cache statistics"""
    try:
        stats = cache.get_cache_stats()
        return {
            "message": "Cache statistics retrieved successfully",
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get cache stats: {str(e)}"
        )