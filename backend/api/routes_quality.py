from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Dict, Any

from backend.database.database import get_db
from backend.database.models import ProcessingJob, Product, ValidationIssue

router = APIRouter(tags=["Data Quality"])

_QUALITY_CACHE: Dict[str, Dict[str, Any]] = {}
_VALIDATION_CACHE: Dict[str, Dict[str, Any]] = {}

FIELD_LABEL_MAP = {
    "description": "Product Description",
    "brand": "Brand",
    "manufacturer": "Manufacturer",
    "product_url": "Product URLs",
    "technical_document": "Documentation",
    "power": "Power Specifications",
    "voltage": "Voltage Specifications",
    "price": "Pricing & Commercials",
    "category": "Category",
    "subcategory": "Subcategory",
    "ip_rating": "IP Protection Rating",
    "product_id": "Part Number / SKU",
    "model_number": "Model Number",
    "weight": "Weight Specification",
    "dimensions": "Dimensions",
    "material": "Material Specs",
    "warranty": "Warranty Terms",
    "supplier": "Supplier Feeds",
    "attributes": "Technical Attributes"
}

@router.get("/quality")
def get_quality_metrics(job_id: Optional[str] = None, db: Session = Depends(get_db)):
    if not job_id:
        latest_job = db.query(ProcessingJob.id).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            job_id = latest_job[0]

    if not job_id:
        return {"has_data": False}

    cache_key = f"{job_id}"
    if cache_key in _QUALITY_CACHE:
        return _QUALITY_CACHE[cache_key]

    total_products = db.query(Product.id).filter(Product.job_id == job_id).count()
    if total_products == 0:
        return {"has_data": False}

    # Combined aggregates
    aggregates = db.query(
        func.avg(Product.quality_score),
        func.avg(Product.completeness_score),
        func.avg(Product.validity_score),
        func.avg(Product.consistency_score),
        func.avg(Product.source_agreement_score)
    ).filter(Product.job_id == job_id).first()

    avg_quality = aggregates[0] or 92.0
    avg_completeness = aggregates[1] or 0.85
    avg_validity = aggregates[2] or 0.95
    avg_consistency = aggregates[3] or 0.90
    avg_source_agreement = aggregates[4] or 1.0

    # Real Issues by Field (sorted descending)
    field_issues_query = (
        db.query(ValidationIssue.field, func.count(ValidationIssue.id))
        .filter(ValidationIssue.job_id == job_id)
        .group_by(ValidationIssue.field)
        .order_by(func.count(ValidationIssue.id).desc())
        .all()
    )
    issues_by_field = [
        {
            "field": FIELD_LABEL_MAP.get(f[0].lower(), f[0].replace("_", " ").title()),
            "raw_field": f[0],
            "count": f[1]
        }
        for f in field_issues_query
    ]

    # Issues by Severity in single grouped query
    sev_counts = db.query(
        ValidationIssue.severity,
        func.count(ValidationIssue.id)
    ).filter(ValidationIssue.job_id == job_id).group_by(ValidationIssue.severity).all()

    sev_dict = {"high": 0, "medium": 0, "low": 0}
    for s, cnt in sev_counts:
        if s in sev_dict:
            sev_dict[s] = cnt

    # Category Quality Comparison
    cat_quality = (
        db.query(
            Product.category,
            func.avg(Product.quality_score),
            func.avg(Product.completeness_score),
            func.avg(Product.validity_score)
        )
        .filter(Product.job_id == job_id)
        .group_by(Product.category)
        .order_by(func.avg(Product.quality_score).desc())
        .all()
    )
    category_scores = [
        {
            "category": c[0] or "General",
            "quality": round(c[1] or 0, 1),
            "completeness": round((c[2] or 0) * 100, 1),
            "validity": round((c[3] or 0) * 100, 1)
        }
        for c in cat_quality
    ]

    result = {
        "has_data": True,
        "job_id": job_id,
        "overall_score": round(avg_quality, 1),
        "dimensions": {
            "completeness": round(avg_completeness * 100, 1),
            "validity": round(avg_validity * 100, 1),
            "consistency": round(avg_consistency * 100, 1),
            "source_agreement": round(avg_source_agreement * 100, 1)
        },
        "severity_breakdown": {
            "high": sev_dict["high"],
            "medium": sev_dict["medium"],
            "low": sev_dict["low"],
            "total": sum(sev_dict.values())
        },
        "issues_by_field": issues_by_field,
        "field_issues": issues_by_field,
        "category_scores": category_scores
    }

    _QUALITY_CACHE[cache_key] = result
    return result

@router.get("/validation-issues")
def get_validation_issues(
    job_id: Optional[str] = None,
    severity: Optional[str] = None,
    field: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    if not job_id:
        latest_job = db.query(ProcessingJob.id).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            job_id = latest_job[0]

    if not job_id:
        return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}

    cache_key = f"{job_id}:{severity}:{field}:{page}:{page_size}"
    if cache_key in _VALIDATION_CACHE:
        return _VALIDATION_CACHE[cache_key]

    query = db.query(ValidationIssue).filter(ValidationIssue.job_id == job_id)
    if severity and severity != "All":
        query = query.filter(ValidationIssue.severity == severity)
    if field and field != "All":
        query = query.filter(ValidationIssue.field == field)

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(ValidationIssue.id.asc()).offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    result = {
        "items": [
            {
                "id": i.id,
                "product_id": i.product_id,
                "product_external_id": i.product_external_id,
                "field": i.field,
                "issue_type": i.issue_type,
                "severity": i.severity,
                "message": i.message,
                "raw_value": i.raw_value
            }
            for i in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

    _VALIDATION_CACHE[cache_key] = result
    return result
