import os
import uuid
import asyncio
import json
from typing import Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.models import ProcessingJob
from backend.processors.job_manager import job_manager
from backend.processors.pipeline import run_processing_pipeline
from backend.processors.file_parser import parse_file
from backend.ai.schema_analyzer import schema_analyzer

router = APIRouter(tags=["Upload & Ingestion"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")

DATASET_PRESETS = {
    "dataset_a": {
        "id": "dataset_a",
        "name": "Dataset A — Industrial Manufacturing OEM",
        "filename": "dataset_a_manufacturing.csv",
        "description": "Manufacturer Part Numbers with separate brand and manufacturer columns (Mfg_Part_Num, Part_Desc, E1_Brand, Part_Manuf)",
        "expected_columns": ["Mfg_Part_Num", "Part_Desc", "E1_Brand", "Part_Manuf"],
        "row_count": 10
    },
    "dataset_b": {
        "id": "dataset_b",
        "name": "Dataset B — Procurement & Supplier Catalog",
        "filename": "dataset_b_procurement.csv",
        "description": "Commercial purchasing catalog with pricing and supplier feeds (SKU, Item_Name, Maker, Supplier, Price)",
        "expected_columns": ["SKU", "Item_Name", "Maker", "Supplier", "Price"],
        "row_count": 10
    },
    "dataset_c": {
        "id": "dataset_c",
        "name": "Dataset C — Engineering Technical Specifications",
        "filename": "dataset_c_engineering.csv",
        "description": "Technical component specs with voltage and metric mass ratings (ProductCode, LongDescription, ManufacturerName, BrandName, VoltageRating, WeightKg)",
        "expected_columns": ["ProductCode", "LongDescription", "ManufacturerName", "BrandName", "VoltageRating", "WeightKg"],
        "row_count": 10
    },
    "demo_1000": {
        "id": "demo_1000",
        "name": "Full Industrial Demo Catalog (1,000+ Items)",
        "filename": "sample_products_1000.csv",
        "description": "Comprehensive multi-category catalog containing unit discrepancies, duplicate clusters, and OEM conflicts",
        "expected_columns": ["product_id", "product_name", "brand", "category", "price", "power", "voltage", "weight", "dimensions"],
        "row_count": 1050
    }
}

@router.post("/schema/analyze")
async def analyze_uploaded_schema(
    file: UploadFile = File(...)
):
    """
    Step 1 of Ingestion Flow:
    Analyzes uploaded file headers, inspects data types, extracts sample values,
    and runs Gemini AI semantic column analysis with fingerprint caching.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".csv", ".xlsx", ".xls", ".tsv", ".txt"]:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Upload CSV or XLSX.")
        
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
    try:
        raw_rows, detected_columns = parse_file(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
        
    if not detected_columns:
        raise HTTPException(status_code=400, detail="No column headers detected in the dataset.")
        
    analysis = await schema_analyzer.analyze_schema(
        headers=detected_columns,
        sample_rows=raw_rows[:20],
        total_rows=len(raw_rows),
        dataset_name=file.filename
    )
    
    return {
        "filename": file.filename,
        "size_bytes": len(content),
        "total_rows": len(raw_rows),
        "total_columns": len(detected_columns),
        "analysis": analysis
    }

@router.post("/upload")
async def upload_catalog(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    mapping: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Step 2 of Ingestion Flow:
    Creates job state and launches the background processing pipeline immediately.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".csv", ".xlsx", ".xls", ".tsv", ".txt"]:
        raise HTTPException(status_code=400, detail=f"Unsupported file format '{ext}'. Use CSV or XLSX.")
        
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
    schema_mapping = None
    if mapping:
        try:
            schema_mapping = json.loads(mapping)
        except Exception:
            schema_mapping = None
            
    job_id = f"job-{uuid.uuid4().hex[:10]}"
    
    # 1. Initialize in-memory JobState
    job_manager.create_job(job_id=job_id, filename=file.filename)
    
    # 2. Initialize database record
    job_rec = ProcessingJob(
        id=job_id,
        filename=file.filename,
        file_size_bytes=len(content),
        current_stage="init",
        status="running",
        progress_percentage=0.0
    )
    db.add(job_rec)
    db.commit()
    
    # 3. Launch background processing pipeline
    background_tasks.add_task(
        run_processing_pipeline,
        job_id,
        content,
        file.filename,
        schema_mapping
    )
    
    return {
        "job_id": job_id,
        "filename": file.filename,
        "size_bytes": len(content),
        "status": "queued",
        "progress": 0,
        "message": "Processing job queued. Background pipeline initialized."
    }

@router.get("/sample")
def get_sample_csv():
    """
    Returns the primary 1,000+ product industrial demo catalog as text/csv.
    """
    sample_path = os.path.join(DATA_DIR, "sample_products_1000.csv")
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail=f"Demo sample file not found at {sample_path}")
    return FileResponse(
        sample_path,
        media_type="text/csv",
        filename="sample_products_1000.csv",
        headers={
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": "inline; filename=\"sample_products_1000.csv\""
        }
    )

@router.get("/sample-datasets")
def list_sample_datasets():
    """Returns metadata for all available test and demo datasets."""
    datasets_list = []
    for key, item in DATASET_PRESETS.items():
        file_path = os.path.join(DATA_DIR, item["filename"])
        exists = os.path.exists(file_path)
        datasets_list.append({
            **item,
            "available": exists
        })
    return {"datasets": datasets_list}

@router.get("/sample-datasets/{dataset_id}/file")
def get_sample_dataset_file(dataset_id: str):
    """Downloads or fetches the raw file for a given dataset preset."""
    if dataset_id not in DATASET_PRESETS:
        raise HTTPException(status_code=404, detail=f"Dataset preset '{dataset_id}' not found.")
    preset = DATASET_PRESETS[dataset_id]
    sample_path = os.path.join(DATA_DIR, preset["filename"])
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail=f"File {preset['filename']} not found.")
    return FileResponse(
        sample_path,
        media_type="text/csv",
        filename=preset["filename"],
        headers={
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": f"inline; filename=\"{preset['filename']}\""
        }
    )

@router.post("/sample-datasets/{dataset_id}/analyze")
async def analyze_sample_dataset(dataset_id: str):
    """Runs AI schema analysis on a preset sample dataset."""
    if dataset_id not in DATASET_PRESETS:
        raise HTTPException(status_code=404, detail=f"Dataset preset '{dataset_id}' not found.")
        
    preset = DATASET_PRESETS[dataset_id]
    file_path = os.path.join(DATA_DIR, preset["filename"])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Dataset file '{preset['filename']}' not found.")
        
    with open(file_path, "rb") as f:
        content = f.read()
        
    raw_rows, detected_columns = parse_file(content, preset["filename"])
    analysis = await schema_analyzer.analyze_schema(
        headers=detected_columns,
        sample_rows=raw_rows[:20],
        total_rows=len(raw_rows),
        dataset_name=preset["name"]
    )
    
    return {
        "dataset_id": dataset_id,
        "name": preset["name"],
        "filename": preset["filename"],
        "total_rows": len(raw_rows),
        "total_columns": len(detected_columns),
        "analysis": analysis
    }

@router.post("/sample-datasets/{dataset_id}/process")
async def process_sample_dataset(
    dataset_id: str,
    background_tasks: BackgroundTasks,
    mapping: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Processes a preset sample dataset with optional confirmed schema mapping."""
    if dataset_id not in DATASET_PRESETS:
        raise HTTPException(status_code=404, detail=f"Dataset preset '{dataset_id}' not found.")
        
    preset = DATASET_PRESETS[dataset_id]
    file_path = os.path.join(DATA_DIR, preset["filename"])
    file_found = os.path.exists(file_path)
    
    if not file_found:
        raise HTTPException(status_code=404, detail=f"Dataset file '{preset['filename']}' not found at {file_path}.")
        
    with open(file_path, "rb") as f:
        content = f.read()
        
    raw_rows, detected_columns = parse_file(content, preset["filename"])
        
    schema_mapping = None
    if mapping:
        try:
            schema_mapping = json.loads(mapping)
        except Exception:
            schema_mapping = None
            
    job_id = f"{dataset_id[:4]}-{uuid.uuid4().hex[:8]}"
    
    # 1. Initialize JobState
    job_manager.create_job(job_id=job_id, filename=preset["filename"], total=len(raw_rows))
    
    # 2. Initialize Database Record
    job_rec = ProcessingJob(
        id=job_id,
        filename=preset["filename"],
        file_size_bytes=len(content),
        total_rows=len(raw_rows),
        current_stage="init",
        status="running",
        progress_percentage=0.0
    )
    db.add(job_rec)
    db.commit()
    
    # 3. Launch background pipeline
    background_tasks.add_task(
        run_processing_pipeline,
        job_id,
        content,
        preset["filename"],
        schema_mapping
    )
    
    return {
        "valid": True,
        "job_id": job_id,
        "filename": preset["filename"],
        "rows": len(raw_rows),
        "columns": len(detected_columns),
        "size_bytes": len(content),
        "status": "queued",
        "progress": 0,
        "message": f"Dataset '{preset['name']}' queued and processing pipeline started."
    }

@router.post("/demo-dataset")
async def load_demo_dataset(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    return await process_sample_dataset("demo_1000", background_tasks, None, db)

@router.get("/download-demo-sample")
def download_demo_sample():
    sample_path = os.path.join(DATA_DIR, "sample_products_1000.csv")
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Demo dataset file not found.")
    return FileResponse(
        sample_path,
        media_type="text/csv",
        filename="productiq_sample_products_1000.csv"
    )

@router.get("/download-dataset/{dataset_id}")
def download_dataset_by_id(dataset_id: str):
    if dataset_id not in DATASET_PRESETS:
        raise HTTPException(status_code=404, detail="Dataset preset not found.")
    preset = DATASET_PRESETS[dataset_id]
    sample_path = os.path.join(DATA_DIR, preset["filename"])
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail=f"File {preset['filename']} not found.")
    return FileResponse(
        sample_path,
        media_type="text/csv",
        filename=preset["filename"]
    )

@router.get("/jobs/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    # First check live in-memory JobManager state
    live_job = job_manager.get_job(job_id)
    if live_job:
        return live_job.to_dict()

    # Fallback to database record if server restarted or job concluded
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
        
    stats_dict = job.stats or {}
    return {
        "job_id": job.id,
        "filename": job.filename,
        "file_size_bytes": job.file_size_bytes,
        "total_rows": job.total_rows,
        "processed_rows": job.processed_rows,
        "current_stage": job.current_stage,
        "stage": job.current_stage,
        "stage_progress": 100 if job.status == "completed" else int(job.progress_percentage or 0),
        "status": "completed" if job.status == "completed" else ("failed" if job.status == "failed" else "processing"),
        "progress": int(job.progress_percentage or 0),
        "progress_percentage": job.progress_percentage,
        "processed": job.processed_rows,
        "total": job.total_rows,
        "speed": stats_dict.get("throughput_rows_per_sec", 0.0),
        "eta_seconds": 0.0 if job.status == "completed" else 0.0,
        "message": stats_dict.get("message") or ("Processing complete" if job.status == "completed" else "Processing catalog..."),
        "error": job.error_message,
        "error_message": job.error_message,
        "stats": {
            "ai_enriched": stats_dict.get("ai_enriched_count", 0),
            "duplicates": stats_dict.get("duplicate_groups_count", 0),
            "conflicts": stats_dict.get("conflicts_count", 0),
            "missing_attributes": stats_dict.get("missing_attributes_count", 0),
            **stats_dict
        },
        "logs": [],
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None
    }

@router.get("/jobs/{job_id}/events")
async def job_events_sse(job_id: str):
    """Server-Sent Events stream for real-time progress reporting."""
    queue = job_manager.subscribe(job_id)
    
    async def event_generator():
        try:
            # Yield initial state
            initial_job = job_manager.get_job(job_id)
            initial_payload = initial_job.to_dict() if initial_job else {"job_id": job_id, "status": "queued"}
            yield f"data: {json.dumps({'event': 'connected', 'data': initial_payload})}\n\n"
            
            while True:
                payload = await queue.get()
                yield f"data: {json.dumps(payload)}\n\n"
                if payload.get("event") in ["pipeline_complete", "pipeline_error"]:
                    break
        except asyncio.CancelledError:
            pass
        finally:
            job_manager.unsubscribe(job_id, queue)
                
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
