import os
import sys
import time
import asyncio
from backend.database.database import SessionLocal
from backend.database.models import ProcessingJob, Product, ProductAttribute
from backend.processors.pipeline import run_processing_pipeline
from backend.ai.schema_analyzer import schema_analyzer

def test_full_pipeline_multi_schemas():
    print("=" * 70)
    print("PRODUCTIQ — END-TO-END MULTI-SCHEMA INGESTION VERIFICATION")
    print("=" * 70)

    test_files = [
        ("data/dataset_a_manufacturing.csv", "Dataset A (OEM Schema)"),
        ("data/dataset_b_procurement.csv", "Dataset B (Procurement Schema)"),
        ("data/dataset_c_engineering.csv", "Dataset C (Engineering Schema)")
    ]

    for file_path, label in test_files:
        print(f"\n---> Testing {label} [{file_path}]")
        assert os.path.exists(file_path), f"File {file_path} not found"
        
        with open(file_path, "rb") as f:
            content = f.read()
            
        import uuid
        job_id = f"test-{uuid.uuid4().hex[:8]}"
        
        # Run pipeline asynchronously
        asyncio.run(run_processing_pipeline(job_id, content, os.path.basename(file_path)))
        
        # Verify Database records
        db = SessionLocal()
        try:
            job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
            assert job is not None, f"Job {job_id} not found"
            assert job.status == "completed", f"Job status is {job.status}, error: {job.error_message}"
            assert job.total_rows == 10
            assert job.processed_rows == 10
            
            products = db.query(Product).filter(Product.job_id == job_id).all()
            assert len(products) == 10, f"Expected 10 products, got {len(products)}"
            
            for p in products:
                assert p.product_name and len(p.product_name) > 3, f"Product name missing: {p.id}"
                assert p.brand and len(p.brand) > 1, f"Brand missing: {p.id}"
                assert p.category and len(p.category) > 1, f"Category missing: {p.id}"
                assert p.validation_status in ("valid", "warning"), f"Invalid product status: {p.validation_status}"
                
            print(f" [PASS] Successfully ingested 10 products for {label}!")
            print(f"        Sample Product 1: Name='{products[0].product_name}', Brand='{products[0].brand}', Category='{products[0].category}', ValidStatus='{products[0].validation_status}'")
            print(f"        Sample Product 2: Name='{products[1].product_name}', Brand='{products[1].brand}', Category='{products[1].category}', ValidStatus='{products[1].validation_status}'")
        finally:
            db.close()

    print("\n" + "=" * 70)
    print("ALL 3 SCHEMAS AUTOMATICALLY INGESTED & VERIFIED WITHOUT HARDCODED RULES!")
    print("=" * 70)

if __name__ == "__main__":
    test_full_pipeline_multi_schemas()
