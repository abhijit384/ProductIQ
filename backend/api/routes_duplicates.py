from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Optional, Dict, Any
from pydantic import BaseModel

from backend.database.database import get_db
from backend.database.models import ProcessingJob, DuplicateGroup, DuplicateItem, Product

router = APIRouter(tags=["Duplicates"])

# In-memory fast cache
_DUPLICATES_CACHE: Dict[str, Dict[str, Any]] = {}

def invalidate_duplicates_cache(job_id: Optional[str] = None):
    global _DUPLICATES_CACHE
    if job_id:
        keys_to_remove = [k for k in _DUPLICATES_CACHE if k.startswith(job_id)]
        for k in keys_to_remove:
            _DUPLICATES_CACHE.pop(k, None)
    else:
        _DUPLICATES_CACHE.clear()

class ResolveDuplicateRequest(BaseModel):
    action: str  # merge, ignore, review
    notes: Optional[str] = None

@router.get("/duplicates")
def get_duplicates(
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if not job_id:
        latest_job = db.query(ProcessingJob.id).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            job_id = latest_job[0]

    if not job_id:
        return {"groups": [], "total_groups": 0, "total_duplicate_items": 0, "pending_groups": 0, "merged_groups": 0}

    cache_key = f"{job_id}:{status}"
    if cache_key in _DUPLICATES_CACHE:
        return _DUPLICATES_CACHE[cache_key]

    query = db.query(DuplicateGroup).options(
        joinedload(DuplicateGroup.items).joinedload(DuplicateItem.product)
    ).filter(DuplicateGroup.job_id == job_id)

    if status and status != "All":
        query = query.filter(DuplicateGroup.status == status)

    groups = query.order_by(DuplicateGroup.id.asc()).all()

    total_items_count = 0
    serialized_groups = []
    pending_count = 0
    merged_count = 0
    
    for g in groups:
        if g.status == "pending":
            pending_count += 1
        elif g.status == "merged":
            merged_count += 1

        items_data = []
        for it in g.items:
            total_items_count += 1
            p = it.product
            items_data.append({
                "id": it.id,
                "product_id": it.product_id,
                "product_external_id": it.product_external_id or (p.product_id if p else ""),
                "product_name": it.product_name or (p.product_name if p else "Industrial Component"),
                "brand": it.brand or (p.brand if p else "Standard"),
                "model_number": it.model_number or (p.model_number if p else "N/A"),
                "similarity_score": round((it.similarity_score or 1.0) * 100, 1),
                "price": p.price if p else None,
                "currency": p.currency if p else "USD",
                "power": p.power if p else "",
                "voltage": p.voltage if p else "",
                "source": p.source if p else "",
                "quality_score": p.quality_score if p else 90.0
            })

        serialized_groups.append({
            "id": g.id,
            "job_id": g.job_id,
            "group_code": g.group_code,
            "canonical_product_id": g.canonical_product_id,
            "canonical_name": g.canonical_name or "Canonical Master SKU",
            "similarity_score": round((g.similarity_score or 0.85) * (100 if (g.similarity_score or 0.85) <= 1.0 else 1), 1),
            "status": g.status or "pending",
            "resolution_notes": g.resolution_notes,
            "members": items_data,
            "created_at": g.created_at.isoformat() if g.created_at else None
        })

    result = {
        "groups": serialized_groups,
        "total_groups": len(serialized_groups),
        "total_duplicate_items": total_items_count,
        "pending_groups": pending_count,
        "merged_groups": merged_count
    }

    _DUPLICATES_CACHE[cache_key] = result
    return result

@router.post("/duplicates/{group_id}/resolve")
def resolve_duplicate_group(
    group_id: int,
    req: ResolveDuplicateRequest,
    db: Session = Depends(get_db)
):
    group = db.query(DuplicateGroup).filter(DuplicateGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Duplicate group not found")

    valid_actions = ["merge", "merged", "ignore", "ignored", "review", "reviewed"]
    if req.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action '{req.action}'. Allowed: {valid_actions}")

    canonical_action = "merged" if req.action in ["merge", "merged"] else ("ignored" if req.action in ["ignore", "ignored"] else "reviewed")
    group.status = canonical_action
    group.resolution_notes = req.notes or f"Duplicate cluster marked as {canonical_action}"

    db.commit()
    invalidate_duplicates_cache(group.job_id)

    return {
        "success": True,
        "group_id": group_id,
        "new_status": group.status,
        "message": f"Duplicate group {group.group_code} updated to '{canonical_action}'."
    }
