import io
import csv
import pandas as pd
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional

from backend.database.database import get_db
from backend.database.models import (
    ProcessingJob, Product, ValidationIssue, DuplicateGroup, DuplicateItem, Conflict, AIResult
)

router = APIRouter(tags=["Export & Reporting"])

def generate_product_export_rows(products):
    rows = []
    for p in products:
        ai_res = p.ai_result
        enriched = p.enriched_data if isinstance(p.enriched_data, dict) else {}
        
        # Category
        cat = p.category
        if ai_res and ai_res.predicted_category:
            cat = ai_res.predicted_category
        elif enriched.get("category"):
            cat = enriched.get("category")
            
        # Subcategory
        subcat = p.subcategory
        if ai_res and ai_res.predicted_subcategory:
            subcat = ai_res.predicted_subcategory
        elif enriched.get("subcategory"):
            subcat = enriched.get("subcategory")
            
        # Brand
        brand = p.brand
        if ai_res and ai_res.predicted_brand:
            brand = ai_res.predicted_brand
        elif enriched.get("brand"):
            brand = enriched.get("brand")
            
        # Description
        desc = p.description
        if ai_res and ai_res.normalized_description:
            desc = ai_res.normalized_description
        elif enriched.get("normalized_description"):
            desc = enriched.get("normalized_description")
            
        # Confidence score
        ai_conf = p.ai_confidence
        if ai_res and ai_res.confidence_score is not None:
            ai_conf = ai_res.confidence_score
        elif enriched.get("confidence_score") is not None:
            ai_conf = enriched.get("confidence_score")
        if ai_conf is None:
            ai_conf = 0.0
        ai_conf_pct = round(ai_conf * 100, 1) if ai_conf <= 1.0 else round(ai_conf, 1)

        rows.append({
            "Product ID": p.product_id or "",
            "Product Name": p.product_name or "",
            "Brand": brand or "",
            "Category": cat or "",
            "Subcategory": subcat or "",
            "Model Number": p.model_number or "",
            "Price": p.price if p.price is not None else "",
            "Currency": p.currency or "USD",
            "Voltage": p.voltage or "",
            "Power": p.power or "",
            "Frequency": p.frequency or "",
            "RPM": p.rpm or "",
            "Weight": p.weight or "",
            "Dimensions": p.dimensions or "",
            "IP Rating": p.ip_rating or "",
            "Material": p.material or "",
            "Warranty": p.warranty or "",
            "Supplier": p.supplier or "",
            "Source": p.source or "",
            "Quality Score": round(p.quality_score, 1) if p.quality_score is not None else 0.0,
            "AI Confidence %": ai_conf_pct,
            "Validation Status": p.validation_status or "valid",
            "Cleaned Description": desc or "",
            "Product URL": p.product_url or ""
        })
    return rows

@router.get("/download")
@router.get("/export/products")
def export_products(
    job_id: Optional[str] = None,
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
    filename: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if not job_id:
        latest_job = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            job_id = latest_job.id

    if not job_id:
        raise HTTPException(status_code=404, detail="No catalog job found")

    products = db.query(Product).filter(Product.job_id == job_id).order_by(Product.id.asc()).all()
    if not products:
        raise HTTPException(status_code=404, detail="No products to export")

    rows = generate_product_export_rows(products)
    df = pd.DataFrame(rows)

    out_filename = filename or ("ProductIQ_Enriched_Output.csv" if format == "csv" else "ProductIQ_Enriched_Output.xlsx")

    if format == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{out_filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    else:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Enriched Catalog")
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="{out_filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

@router.get("/export/conflicts")
def export_conflicts(job_id: Optional[str] = None, db: Session = Depends(get_db)):
    if not job_id:
        latest_job = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            job_id = latest_job.id

    conflicts = db.query(Conflict).filter(Conflict.job_id == job_id).all()
    rows = [
        {
            "Conflict ID": c.id,
            "Product Name": c.product_name,
            "Model Number": c.model_number,
            "Field": c.field,
            "Source A": c.source_a,
            "Value A": c.value_a,
            "Source B": c.source_b,
            "Value B": c.value_b,
            "Severity": c.severity,
            "AI Explanation": c.ai_explanation,
            "Status": c.status,
            "Resolution Notes": c.resolution_notes
        }
        for c in conflicts
    ]

    output = io.StringIO()
    df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["Conflict ID", "Field", "Source A", "Value A", "Source B", "Value B", "Status"])
    df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=productiq_conflicts_report_{job_id[:8]}.csv"}
    )

@router.get("/export/duplicates")
def export_duplicates(job_id: Optional[str] = None, db: Session = Depends(get_db)):
    if not job_id:
        latest_job = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            job_id = latest_job.id

    groups = db.query(DuplicateGroup).filter(DuplicateGroup.job_id == job_id).all()
    rows = []
    for g in groups:
        for it in g.items:
            rows.append({
                "Group Code": g.group_code,
                "Group Status": g.status,
                "Cluster Similarity %": round(g.similarity_score * 100, 1),
                "Canonical Product": g.canonical_name,
                "Product ID": it.product_external_id,
                "Product Name": it.product_name,
                "Brand": it.brand,
                "Model Number": it.model_number,
                "Specs Summary": it.specs_summary
            })

    output = io.StringIO()
    df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["Group Code", "Group Status", "Product Name"])
    df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=productiq_duplicates_report_{job_id[:8]}.csv"}
    )

@router.get("/export/validation")
def export_validation_report(job_id: Optional[str] = None, db: Session = Depends(get_db)):
    if not job_id:
        latest_job = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).first()
        if latest_job:
            job_id = latest_job.id

    issues = db.query(ValidationIssue).filter(ValidationIssue.job_id == job_id).all()
    rows = [
        {
            "Issue ID": i.id,
            "Product ID": i.product_external_id,
            "Field": i.field,
            "Issue Type": i.issue_type,
            "Severity": i.severity,
            "Message": i.message,
            "Raw Value": i.raw_value
        }
        for i in issues
    ]

    output = io.StringIO()
    df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["Issue ID", "Product ID", "Field", "Severity", "Message"])
    df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=productiq_validation_report_{job_id[:8]}.csv"}
    )
