from typing import List, Dict, Any, Optional
from backend.services.conflict_service import conflict_service

def detect_conflicts(
    products: List[Dict[str, Any]],
    duplicate_groups: Optional[List[Dict[str, Any]]] = None,
    raw_rows: Optional[List[Dict[str, Any]]] = None,
    job_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Backwards-compatible wrapper routing directly to the unified ConflictDetectionService.
    """
    return conflict_service.detect_conflicts(
        normalized_products=products,
        raw_rows=raw_rows,
        duplicate_groups=duplicate_groups,
        job_id=job_id
    )
