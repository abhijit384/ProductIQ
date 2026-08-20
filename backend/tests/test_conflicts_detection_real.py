import pytest
import uuid
from fastapi.testclient import TestClient
from backend.main import app
from backend.processors.conflict_detector import detect_conflicts
from backend.processors.deduplicator import detect_duplicates
from backend.database.database import SessionLocal
from backend.database.models import ProcessingJob, Conflict

client = TestClient(app)

def test_detect_conflicts_multi_source_and_persistence():
    # 1. Multi-source product with conflicting brand feeds (E1_Brand vs Unilog_Brand)
    sample_products = [
        {
            "product_id": "P-101",
            "product_name": "ABB Industrial High Voltage Motor 55kW",
            "model_number": "ABB-MTR-55",
            "brand": "ABB",
            "manufacturer": "ABB Group",
            "power": "55 kW",
            "voltage": "400 V",
            "price": 3200.0,
            "source": "Catalog Feed A",
            "additional_attributes": {
                "E1_Brand": "ABB",
                "Unilog_Brand": "Siemens Simatic",  # Real conflict
                "DIB_Brand": "-- No DIB Brand --"    # Placeholder (ignored)
            }
        },
        {
            "product_id": "P-102",
            "product_name": "ABB Industrial High Voltage Motor 55kW",
            "model_number": "ABB-MTR-55",
            "brand": "ABB",
            "manufacturer": "ABB Group",
            "power": "75 kW",  # Real spec conflict with P-101
            "voltage": "400 V",
            "price": 3900.0,
            "source": "Catalog Feed B",
            "additional_attributes": {}
        }
    ]

    dup_groups = detect_duplicates(sample_products, threshold=0.75)
    conflicts = detect_conflicts(sample_products, dup_groups)

    assert len(conflicts) >= 2  # At least 1 brand conflict and 1 power spec conflict

    # Verify brand conflict structure
    brand_conflicts = [c for c in conflicts if c["field"] == "brand"]
    assert len(brand_conflicts) >= 1
    assert brand_conflicts[0]["source_a"] != brand_conflicts[0]["source_b"]
    assert brand_conflicts[0]["severity"] == "high"

    # Verify power conflict structure
    power_conflicts = [c for c in conflicts if c["field"] == "power"]
    assert len(power_conflicts) >= 1
    assert "55" in power_conflicts[0]["value_a"] or "55" in power_conflicts[0]["value_b"]

    # 2. Test API endpoints with database persistence
    db = SessionLocal()
    try:
        unique_job_id = f"test-job-conflicts-{uuid.uuid4().hex[:8]}"
        job = ProcessingJob(id=unique_job_id, filename="test.csv", status="completed", progress_percentage=100.0)
        db.add(job)
        db.commit()
        db.refresh(job)

        for c in conflicts:
            db_c = Conflict(
                job_id=job.id,
                product_name=c["product_name"],
                model_number=c["model_number"],
                field=c["field"],
                source_a=c["source_a"],
                value_a=c["value_a"],
                source_b=c["source_b"],
                value_b=c["value_b"],
                severity=c["severity"],
                ai_explanation=c["ai_explanation"],
                status="pending"
            )
            db.add(db_c)
        db.commit()

        # Check /api/conflicts/summary
        res_summary = client.get(f"/api/conflicts/summary?job_id={job.id}")
        assert res_summary.status_code == 200
        summary_data = res_summary.json()
        assert summary_data["total"] == len(conflicts)
        assert summary_data["pending"] == len(conflicts)

        # Check /api/conflicts
        res_list = client.get(f"/api/conflicts?job_id={job.id}")
        assert res_list.status_code == 200
        list_data = res_list.json()
        assert list_data["total"] == len(conflicts)
        assert len(list_data["items"]) == len(conflicts)

        # Check debug endpoint
        res_debug = client.get(f"/api/debug/conflicts?job_id={job.id}")
        assert res_debug.status_code == 200
        debug_data = res_debug.json()
        assert debug_data["stored_in_active_job"] == len(conflicts)

    finally:
        db.close()
