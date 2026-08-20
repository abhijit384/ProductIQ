from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

from backend.database.database import get_db
from backend.database.models import ProcessingJob, Conflict, Product
from backend.services.conflict_service import conflict_service

router = APIRouter(tags=["Conflicts"])

# In-memory fast cache for conflict queries
_CONFLICTS_CACHE: Dict[str, Dict[str, Any]] = {}
_DATA_GAPS_CACHE: Dict[str, Dict[str, Any]] = {}
_RECONCILIATION_CACHE: Dict[str, List[Dict[str, Any]]] = {}

def invalidate_conflicts_cache(job_id: Optional[str] = None):
    global _CONFLICTS_CACHE, _DATA_GAPS_CACHE, _RECONCILIATION_CACHE
    if job_id:
        keys_to_remove = [k for k in _CONFLICTS_CACHE if k.startswith(job_id)]
        for k in keys_to_remove:
            _CONFLICTS_CACHE.pop(k, None)
        _DATA_GAPS_CACHE.pop(job_id, None)
        _RECONCILIATION_CACHE.pop(job_id, None)
    else:
        _CONFLICTS_CACHE.clear()
        _DATA_GAPS_CACHE.clear()
        _RECONCILIATION_CACHE.clear()

def warm_conflicts_cache(job_id: str, conflicts_data: Dict[str, Any], data_gaps: Optional[Dict[str, Any]] = None, opps: Optional[List[Dict[str, Any]]] = None):
    """Warms memory cache at the end of catalog pipeline so first page load is instant."""
    cache_key = f"{job_id}:All:All:All::1:25"
    _CONFLICTS_CACHE[cache_key] = conflicts_data
    if data_gaps:
        _DATA_GAPS_CACHE[job_id] = data_gaps
    if opps:
        _RECONCILIATION_CACHE[job_id] = opps

class ResolveConflictRequest(BaseModel):
    action: str  # accept_a, accept_b, keep_for_review
    notes: Optional[str] = None

@router.get("/conflicts/summary")
def get_conflicts_summary(
    job_id: Optional[str] = None,
    dataset_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_job_id = job_id or dataset_id
    if not target_job_id:
        latest_job = db.query(ProcessingJob.id).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            target_job_id = latest_job[0]

    if not target_job_id:
        return {
            "total": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "pending": 0,
            "resolved": 0,
            "dataset_id": None,
            "job_id": None
        }

    # Aggregate counts by status and severity
    counts = db.query(
        Conflict.status,
        Conflict.severity,
        func.count(Conflict.id)
    ).filter(Conflict.job_id == target_job_id).group_by(Conflict.status, Conflict.severity).all()

    total = 0
    pending = 0
    resolved = 0
    severity_counts = {"high": 0, "medium": 0, "low": 0}

    for st, sev, cnt in counts:
        total += cnt
        if st == "pending":
            pending += cnt
        else:
            resolved += cnt
        if sev in severity_counts:
            severity_counts[sev] += cnt

    return {
        "total": total,
        "high": severity_counts["high"],
        "medium": severity_counts["medium"],
        "low": severity_counts["low"],
        "pending": pending,
        "resolved": resolved,
        "dataset_id": target_job_id,
        "job_id": target_job_id
    }

@router.get("/conflicts/data-gaps")
def get_data_gaps(
    job_id: Optional[str] = None,
    dataset_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_job_id = job_id or dataset_id
    if not target_job_id:
        latest_job = db.query(ProcessingJob.id).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            target_job_id = latest_job[0]

    if not target_job_id:
        return {"total_products": 0, "total_data_gaps": 0, "field_gaps": [], "sample_items": []}

    if target_job_id in _DATA_GAPS_CACHE:
        return _DATA_GAPS_CACHE[target_job_id]

    products = db.query(Product).filter(Product.job_id == target_job_id).all()
    prods_dict = [
        {
            "product_id": p.product_id,
            "product_name": p.product_name,
            "brand": p.brand,
            "manufacturer": p.manufacturer,
            "power": p.power,
            "voltage": p.voltage,
            "price": p.price,
            "ip_rating": p.ip_rating,
            "dimensions": p.dimensions,
            "weight": p.weight,
            "source": p.source,
            "additional_attributes": p.raw_data or {}
        }
        for p in products
    ]

    res = conflict_service.detect_data_gaps(prods_dict)
    _DATA_GAPS_CACHE[target_job_id] = res
    return res

@router.get("/conflicts/reconciliation-opportunities")
def get_reconciliation_opportunities(
    job_id: Optional[str] = None,
    dataset_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_job_id = job_id or dataset_id
    if not target_job_id:
        latest_job = db.query(ProcessingJob.id).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            target_job_id = latest_job[0]

    if not target_job_id:
        return {"total": 0, "opportunities": []}

    if target_job_id in _RECONCILIATION_CACHE:
        return {"total": len(_RECONCILIATION_CACHE[target_job_id]), "opportunities": _RECONCILIATION_CACHE[target_job_id]}

    products = db.query(Product).filter(Product.job_id == target_job_id).all()
    prods_dict = [
        {
            "product_id": p.product_id,
            "product_name": p.product_name,
            "brand": p.brand,
            "manufacturer": p.manufacturer,
            "power": p.power,
            "voltage": p.voltage,
            "description": p.description,
            "source": p.source,
            "additional_attributes": p.raw_data or {}
        }
        for p in products
    ]

    opps = conflict_service.detect_reconciliation_opportunities(prods_dict)
    _RECONCILIATION_CACHE[target_job_id] = opps
    return {"total": len(opps), "opportunities": opps}

@router.get("/debug/conflicts")
def debug_conflicts(
    job_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    latest_job = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).first()
    active_job_id = job_id or (latest_job.id if latest_job else None)
    stored_count = db.query(Conflict).filter(Conflict.job_id == active_job_id).count() if active_job_id else 0
    all_conflicts_count = db.query(Conflict).count()
    return {
        "active_job_id": active_job_id,
        "latest_job_id": latest_job.id if latest_job else None,
        "latest_job_status": latest_job.status if latest_job else None,
        "stored_in_active_job": stored_count,
        "total_conflicts_all_jobs": all_conflicts_count
    }

@router.get("/conflicts")
def get_conflicts(
    job_id: Optional[str] = None,
    dataset_id: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    field: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    target_job_id = job_id or dataset_id
    if not target_job_id:
        latest_job = db.query(ProcessingJob.id).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            target_job_id = latest_job[0]

    if not target_job_id:
        return {
            "items": [],
            "conflicts": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0,
            "pending": 0,
            "resolved": 0,
            "severity_counts": {"high": 0, "medium": 0, "low": 0},
            "job_id": None,
            "dataset_id": None
        }

    # Fast in-memory cache lookup
    cache_key = f"{target_job_id}:{status}:{severity}:{field}:{search}:{page}:{page_size}"
    if cache_key in _CONFLICTS_CACHE:
        cached = _CONFLICTS_CACHE[cache_key]
        print(f"[CONFLICT API] Served from Cache. Total: {cached.get('total')}")
        return cached

    # Base query for filtered results directly from SQLite
    query = db.query(Conflict).filter(Conflict.job_id == target_job_id)

    if status and status != "All":
        query = query.filter(Conflict.status == status)
    if severity and severity != "All":
        query = query.filter(Conflict.severity == severity)
    if field and field != "All":
        query = query.filter(Conflict.field == field)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Conflict.product_name.ilike(search_pattern),
                Conflict.model_number.ilike(search_pattern),
                Conflict.field.ilike(search_pattern)
            )
        )

    # Count filtered total
    filtered_total = query.count()

    # Server-side pagination
    offset = (page - 1) * page_size
    conflicts = query.order_by(Conflict.id.asc()).offset(offset).limit(page_size).all()

    # Fast single aggregate query for overall job summary counts
    all_job_conflicts = db.query(
        Conflict.status,
        Conflict.severity,
        func.count(Conflict.id)
    ).filter(Conflict.job_id == target_job_id).group_by(Conflict.status, Conflict.severity).all()

    job_total = 0
    job_pending = 0
    job_resolved = 0
    severity_counts = {"high": 0, "medium": 0, "low": 0}

    for st, sev, count in all_job_conflicts:
        job_total += count
        if st == "pending":
            job_pending += count
        else:
            job_resolved += count
        
        if sev in severity_counts:
            severity_counts[sev] += count

    total_pages = (filtered_total + page_size - 1) // page_size if filtered_total > 0 else 1

    serialized = []
    for c in conflicts:
        serialized.append({
            "id": c.id,
            "job_id": c.job_id,
            "dataset_id": c.job_id,
            "product_id": c.product_id,
            "product_name": c.product_name or "Industrial Catalog Item",
            "model_number": c.model_number or "N/A",
            "field": c.field,
            "attribute": c.field,
            "source_a": c.source_a or "Datasheet A",
            "value_a": c.value_a or "Not available",
            "source_b": c.source_b or "Datasheet B",
            "value_b": c.value_b or "Not available",
            "severity": c.severity or "medium",
            "confidence": 0.94,
            "ai_explanation": c.ai_explanation or f"Variance detected in {c.field} across multi-source spec sheets.",
            "status": c.status or "pending",
            "resolution_notes": c.resolution_notes,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })

    print(f"[CONFLICT API] Dataset ID requested: {dataset_id}")
    print(f"[CONFLICT API] Job ID requested: {job_id}")
    print(f"[CONFLICT API] Stored conflicts found: {job_total}")
    print(f"[CONFLICT API] Returned conflicts: {len(serialized)}")
    print(f"[CONFLICT API] Active filters: status={status}, severity={severity}, field={field}, search={search}")

    result = {
        "items": serialized,
        "conflicts": serialized,
        "total": filtered_total,
        "job_total": job_total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "pending": job_pending,
        "resolved": job_resolved,
        "severity_counts": severity_counts,
        "high": severity_counts["high"],
        "medium": severity_counts["medium"],
        "low": severity_counts["low"],
        "job_id": target_job_id,
        "dataset_id": target_job_id
    }

    _CONFLICTS_CACHE[cache_key] = result
    return result

@router.post("/conflicts/{conflict_id}/resolve")
def resolve_conflict(
    conflict_id: int,
    req: ResolveConflictRequest,
    db: Session = Depends(get_db)
):
    conflict = db.query(Conflict).filter(Conflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")

    valid_actions = ["accept_a", "accept_b", "keep_for_review"]
    if req.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action '{req.action}'. Allowed: {valid_actions}")

    conflict.status = req.action
    conflict.resolution_notes = req.notes or f"Resolved with action: {req.action}"

    if conflict.product_id:
        product = db.query(Product).filter(Product.id == conflict.product_id).first()
        if product:
            target_value = conflict.value_a if req.action == "accept_a" else conflict.value_b
            if hasattr(product, conflict.field) and req.action in ["accept_a", "accept_b"]:
                setattr(product, conflict.field, target_value)

    db.commit()
    invalidate_conflicts_cache(conflict.job_id)

    return {
        "success": True,
        "conflict_id": conflict_id,
        "new_status": conflict.status,
        "message": f"Conflict successfully resolved with '{req.action}'."
    }
