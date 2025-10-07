from fastapi import APIRouter, Depends
from app.auth.service import get_user_state
from app.models import UserState
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter()


@router.delete("/clear", response_model=dict)
async def clear_cache(
    user_state: UserState = Depends(get_user_state),
):
    """
    Clear all server-side caches.
    This removes all cached form template data from memory.
    """
    try:
        from app.forms import cache

        # Clear all cache dictionaries
        with cache._cache_lock:
            cache._template_fields_cache.clear()
            cache._field_options_cache.clear()
            cache._sections_cache.clear()
            cache._form_template_sections_cache.clear()

        logger.info("All caches cleared successfully")
        return {
            "message": "All caches cleared successfully",
            "cleared_caches": [
                "template_fields",
                "field_options",
                "sections",
                "form_template_sections"
            ]
        }
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise


@router.post("/sync", response_model=dict)
async def sync_cache(
    user_state: UserState = Depends(get_user_state),
):
    """
    Sync cache with database.
    This clears the cache and forces fresh data to be loaded on next request.

    Note: The cache will be automatically repopulated when form data is requested.
    This endpoint is useful after database changes to template data.
    """
    try:
        from app.forms import cache

        # Clear all caches
        with cache._cache_lock:
            cache._template_fields_cache.clear()
            cache._field_options_cache.clear()
            cache._sections_cache.clear()
            cache._form_template_sections_cache.clear()

        logger.info(
            "Cache synced with database (cleared and ready for refresh)")
        return {
            "message": "Cache synced with database successfully",
            "status": "Cache cleared and will be repopulated on next request",
            "note": "Template data will be loaded fresh from database when accessed"
        }
    except Exception as e:
        logger.error(f"Failed to sync cache: {e}")
        raise


@router.get("/status", response_model=dict)
async def cache_status(
    user_state: UserState = Depends(get_user_state),
):
    """
    Get current cache statistics.
    Shows how many items are currently cached.
    """
    try:
        from app.forms import cache

        with cache._cache_lock:
            stats = {
                "template_fields_sections_cached": len(cache._template_fields_cache),
                "field_options_cached": len(cache._field_options_cache),
                "sections_cached": len(cache._sections_cache),
                "form_templates_cached": len(cache._form_template_sections_cache),
            }

        logger.info(f"Cache status: {stats}")
        return {
            "message": "Cache statistics retrieved successfully",
            "statistics": stats,
            "cache_enabled": True
        }
    except Exception as e:
        logger.error(f"Failed to get cache status: {e}")
        raise
