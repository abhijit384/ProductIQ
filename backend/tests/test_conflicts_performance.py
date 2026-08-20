import pytest
import time
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.database import SessionLocal
from backend.database.models import ProcessingJob, Conflict

client = TestClient(app)

def test_conflicts_endpoint_performance_and_pagination():
    db = SessionLocal()
    try:
        job = db.query(ProcessingJob).first()
        if not job:
            job = ProcessingJob(status="completed", progress_percentage=100.0)
            db.add(job)
            db.commit()
            db.refresh(job)

        # Seed sample conflicts if none exist
        conflict_count = db.query(Conflict).filter(Conflict.job_id == job.id).count()
        if conflict_count == 0:
            for i in range(18):
                db.add(Conflict(
                    job_id=job.id,
                    product_name=f"Industrial Motor Variant #{i+1}",
                    model_number=f"MTR-{100+i}",
                    field="power" if i % 2 == 0 else "voltage",
                    source_a="Catalog Feed A",
                    value_a=f"{5.5 + (i*0.5)} kW",
                    source_b="Catalog Feed B",
                    value_b=f"{7.5 + (i*0.5)} kW",
                    severity="high" if i < 7 else ("medium" if i < 13 else "low"),
                    ai_explanation=f"Specification variance detected for power rating.",
                    status="pending"
                ))
            db.commit()

        # 1. Measure latency of fetching conflicts
        start_time = time.perf_counter()
        res = client.get(f"/api/conflicts?job_id={job.id}&page=1&page_size=10")
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert "total" in data
        assert "pending" in data
        assert "resolved" in data
        assert "severity_counts" in data
        assert len(data["items"]) <= 10
        assert elapsed_ms < 500  # Target: <500ms for first fetch

        # 2. Second request should hit cache and be even faster (<50ms)
        start_time_cache = time.perf_counter()
        res_cache = client.get(f"/api/conflicts?job_id={job.id}&page=1&page_size=10")
        cache_ms = (time.perf_counter() - start_time_cache) * 1000
        assert res_cache.status_code == 200
        assert cache_ms < 100

        # 3. Test filter by severity
        res_sev = client.get(f"/api/conflicts?job_id={job.id}&severity=high")
        assert res_sev.status_code == 200
        data_sev = res_sev.json()
        for item in data_sev["items"]:
            assert item["severity"] == "high"

        # 4. Test conflict resolution
        first_conflict = data["items"][0]
        res_resolve = client.post(
            f"/api/conflicts/{first_conflict['id']}/resolve",
            json={"action": "accept_a", "notes": "Accepted Datasheet A standard"}
        )
        assert res_resolve.status_code == 200
        res_resolve_json = res_resolve.json()
        assert res_resolve_json["success"] is True
        assert res_resolve_json["new_status"] == "accept_a"

    finally:
        db.close()
