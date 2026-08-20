from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional

from backend.database.database import get_db
from backend.database.models import ProcessingJob, Product, AIResult
from backend.ai.gemini_service import ai_service

router = APIRouter(tags=["AI Enrichment Control Center"])

@router.get("/enrichment")
def get_enrichment_center(job_id: Optional[str] = None, db: Session = Depends(get_db)):
    if not job_id:
        latest_job = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            job_id = latest_job.id

    ai_status = ai_service.get_status()

    if not job_id:
        return {
            "ai_status": ai_status,
            "has_job": False
        }

    total_products = db.query(Product).filter(Product.job_id == job_id).count()
    enriched_products = db.query(Product).filter(Product.job_id == job_id, Product.ai_enriched == True).count()
    ai_results = db.query(AIResult).join(Product).filter(Product.job_id == job_id).limit(10).all()

    recent_samples = []
    total_attrs = 0
    total_kws = 0
    
    all_results = db.query(AIResult).join(Product).filter(Product.job_id == job_id).all()
    for ar in all_results:
        total_attrs += len(ar.extracted_attributes or {})
        total_kws += len(ar.commerce_keywords or [])

    for r in ai_results:
        p = r.product
        recent_samples.append({
            "product_id": p.product_id if p else "",
            "product_name": p.product_name if p else "",
            "model_number": p.model_number if p else "",
            "predicted_category": r.predicted_category,
            "predicted_subcategory": r.predicted_subcategory,
            "predicted_brand": r.predicted_brand,
            "extracted_attributes": r.extracted_attributes,
            "missing_attributes": r.missing_attributes,
            "normalized_description": r.normalized_description,
            "commerce_keywords": r.commerce_keywords,
            "confidence_score": round(r.confidence_score * 100, 1)
        })

    return {
        "ai_status": ai_status,
        "job_id": job_id,
        "metrics": {
            "total_products": total_products,
            "enriched_products": enriched_products,
            "enrichment_coverage_pct": round((enriched_products / max(1, total_products)) * 100, 1),
            "total_attributes_extracted": total_attrs or ai_status["stats"]["total_attributes_extracted"],
            "total_keywords_generated": total_kws or ai_status["stats"]["total_keywords_generated"],
            "cache_hit_rate": ai_status["stats"]["cache_hit_rate_pct"]
        },
        "recent_samples": recent_samples
    }

@router.post("/enrichment/retry")
async def retry_ai_enrichment(
    job_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if not job_id:
        latest_job = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            job_id = latest_job.id

    if not job_id:
        return {"success": False, "message": "No active catalog job."}

    # Fetch products for this job
    products = db.query(Product).filter(Product.job_id == job_id).limit(100).all()
    batch_records = [
        {
            "product_id": p.product_id,
            "product_name": p.product_name,
            "brand": p.brand,
            "category": p.category,
            "model_number": p.model_number,
            "power": p.power,
            "voltage": p.voltage,
            "description": p.description
        }
        for p in products
    ]

    enriched = await ai_service.enrich_batch(batch_records)

    # Save to db
    for p, res in zip(products, enriched):
        p.ai_enriched = True
        p.ai_confidence = res.get("confidence_score", 0.95)
        p.enriched_data = res
        
        # Update or create AIResult
        ai_res = db.query(AIResult).filter(AIResult.product_id == p.id).first()
        if not ai_res:
            ai_res = AIResult(
                product_id=p.id,
                model_name=ai_service.model_name,
                raw_response=res,
                predicted_category=res.get("category"),
                predicted_subcategory=res.get("subcategory"),
                predicted_brand=res.get("brand"),
                extracted_attributes=res.get("attributes", {}),
                missing_attributes=res.get("missing_attributes", []),
                normalized_description=res.get("normalized_description"),
                commerce_keywords=res.get("commerce_keywords", []),
                confidence_score=res.get("confidence_score", 0.95),
                explanation=res.get("explanation", "")
            )
            db.add(ai_res)
        else:
            ai_res.predicted_category = res.get("category")
            ai_res.predicted_subcategory = res.get("subcategory")
            ai_res.extracted_attributes = res.get("attributes", {})
            ai_res.missing_attributes = res.get("missing_attributes", [])
            ai_res.normalized_description = res.get("normalized_description")
            ai_res.commerce_keywords = res.get("commerce_keywords", [])
            ai_res.confidence_score = res.get("confidence_score", 0.95)

    db.commit()

    return {
        "success": True,
        "message": f"Successfully re-enriched {len(products)} products with ASSR AI.",
        "enriched_count": len(products)
    }
