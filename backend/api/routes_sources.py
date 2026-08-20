from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional, Dict, Any

from backend.database.database import get_db
from backend.database.models import ProcessingJob, Product

router = APIRouter(tags=["Data Sources & Lineage"])

_SOURCES_CACHE: Dict[str, Dict[str, Any]] = {}

@router.get("/sources")
def get_sources_intelligence(job_id: Optional[str] = None, db: Session = Depends(get_db)):
    if not job_id:
        latest_job = db.query(ProcessingJob.id).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            job_id = latest_job[0]

    if not job_id:
        return {"sources": [], "total_records": 0, "field_coverage": []}

    cache_key = f"{job_id}"
    if cache_key in _SOURCES_CACHE:
        return _SOURCES_CACHE[cache_key]

    total_products = db.query(Product.id).filter(Product.job_id == job_id).count()
    if total_products == 0:
        return {"sources": [], "total_records": 0, "field_coverage": []}

    source_stats = (
        db.query(
            Product.source,
            func.count(Product.id),
            func.avg(Product.quality_score),
            func.avg(Product.completeness_score),
            func.avg(Product.validity_score)
        )
        .filter(Product.job_id == job_id)
        .group_by(Product.source)
        .order_by(func.count(Product.id).desc())
        .all()
    )

    sources = []
    for s in source_stats:
        s_name = s[0] or "Catalog Source"
        count = s[1]
        sources.append({
            "name": s_name,
            "product_count": count,
            "share_percentage": round((count / max(1, total_products)) * 100, 1),
            "quality_score": round(s[2] or 92.0, 1),
            "completeness_score": round((s[3] or 0.85) * 100, 1),
            "validity_score": round((s[4] or 0.95) * 100, 1),
            "reliability_tier": "High" if (s[2] or 92.0) >= 80 else "Medium"
        })

    # Combined single query for field coverage
    cov = db.query(
        func.count(case((Product.technical_document != "", 1))),
        func.count(case((Product.product_url != "", 1))),
        func.count(case((Product.supplier != "", 1))),
        func.count(case((Product.brand != "", 1))),
        func.count(case(((Product.power != "") & (Product.voltage != ""), 1)))
    ).filter(Product.job_id == job_id).first()

    fields_coverage = [
        {"field": "Technical Document / PDF", "populated": cov[0] or 0, "coverage_pct": round(((cov[0] or 0) / max(1, total_products)) * 100, 1)},
        {"field": "Direct Product URL", "populated": cov[1] or 0, "coverage_pct": round(((cov[1] or 0) / max(1, total_products)) * 100, 1)},
        {"field": "Supplier ID / Master", "populated": cov[2] or 0, "coverage_pct": round(((cov[2] or 0) / max(1, total_products)) * 100, 1)},
        {"field": "Manufacturer / Brand Lineage", "populated": cov[3] or 0, "coverage_pct": round(((cov[3] or 0) / max(1, total_products)) * 100, 1)},
        {"field": "Power / Voltage Specs", "populated": cov[4] or 0, "coverage_pct": round(((cov[4] or 0) / max(1, total_products)) * 100, 1)}
    ]

    result = {
        "job_id": job_id,
        "total_records": total_products,
        "sources": sources,
        "field_coverage": fields_coverage
    }

    _SOURCES_CACHE[cache_key] = result
    return result
