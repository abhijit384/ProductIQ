import asyncio
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.processors.job_manager import job_manager

client = TestClient(app)

def test_immediate_job_creation():
    # 1. Trigger sample dataset processing
    res = client.post("/api/sample-datasets/dataset_a/process")
    assert res.status_code == 200
    data = res.json()
    assert "job_id" in data
    job_id = data["job_id"]
    assert data["status"] == "queued"
    
    # 2. Check initial job status from job_manager
    job_res = client.get(f"/api/jobs/{job_id}")
    assert job_res.status_code == 200
    job_data = job_res.json()
    assert job_data["job_id"] == job_id
    assert "progress" in job_data
    assert "stage" in job_data
    assert "speed" in job_data
    assert "stats" in job_data
    assert "ai_enriched" in job_data["stats"]
    assert "duplicates" in job_data["stats"]
    assert "conflicts" in job_data["stats"]
    assert "missing_attributes" in job_data["stats"]

def test_job_manager_progress_tracking():
    test_job_id = "test-job-999"
    job_state = job_manager.create_job(job_id=test_job_id, filename="test.csv", total=100)
    
    assert job_state.status == "queued"
    assert job_state.progress == 0
    
    # Simulate stage updates
    job_manager.update_and_publish(
        test_job_id,
        status="processing",
        progress=25.0,
        stage="normalization",
        processed=25,
        total=100,
        message="Normalizing 25/100",
        stats_update={"duplicates": 2, "ai_enriched": 5}
    )
    
    state_dict = job_state.to_dict()
    assert state_dict["status"] == "processing"
    assert state_dict["progress"] == 25
    assert state_dict["stage"] == "normalization"
    assert state_dict["processed"] == 25
    assert state_dict["total"] == 100
    assert state_dict["stats"]["duplicates"] == 2
    assert state_dict["stats"]["ai_enriched"] == 5
    assert len(state_dict["logs"]) > 0

    # Simulate completion
    job_manager.update_and_publish(
        test_job_id,
        status="completed",
        progress=100.0,
        stage="completed",
        processed=100,
        total=100,
        message="Finished processing"
    )
    
    final_dict = job_state.to_dict()
    assert final_dict["status"] == "completed"
    assert final_dict["progress"] == 100
