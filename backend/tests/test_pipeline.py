import pytest
import os
from fastapi.testclient import TestClient
from backend.main import app
from backend.processors.normalizer import (
    normalize_brand, normalize_power, normalize_voltage,
    normalize_weight, normalize_ip_rating, normalize_product_record
)
from backend.processors.deduplicator import detect_duplicates, compute_similarity
from backend.processors.validator import validate_product
from backend.processors.quality_scorer import score_product, aggregate_catalog_quality
from backend.processors.file_parser import parse_csv_bytes, parse_file

client = TestClient(app)

def test_normalization_units():
    # Power normalization
    p1, v1 = normalize_power("15 KW")
    assert p1 == "15.0 kW"
    assert v1 == 15.0
    
    p2, v2 = normalize_power("20 HP")
    assert "kW" in p2
    assert v2 is not None
    
    p3, v3 = normalize_power("15000 W")
    assert p3 == "15.0 kW"
    assert v3 == 15.0

    # Voltage normalization
    assert normalize_voltage("400 V") == "400 V"
    assert normalize_voltage("0.4 kV") == "400 V"
    assert normalize_voltage("24 VDC") == "24 V DC"

    # Weight normalization
    assert normalize_weight("12.5 kg") == "12.5 kg"
    assert normalize_weight("22 lbs") == "10.0 kg"

    # IP Rating normalization
    assert normalize_ip_rating("ip55") == "IP55"
    assert normalize_ip_rating("IP 68") == "IP68"

    # Brand canonicalization
    assert normalize_brand("abb") == "ABB"
    assert normalize_brand("siemens simatic") == "Siemens"
    assert normalize_brand("skf") == "SKF"

def test_deduplicator():
    item1 = {
        "product_id": "PID-1",
        "brand": "ABB",
        "product_name": "ABB Industrial Motor M3BP 160",
        "model_number": "ABB-MTR-160",
        "power": "15.0 kW"
    }
    item2 = {
        "product_id": "PID-2",
        "brand": "ABB",
        "product_name": "abb m3bp 160 motor 15kw",
        "model_number": "ABB MTR 160",
        "power": "15.0 kW"
    }
    sim = compute_similarity(item1, item2)
    assert sim >= 0.80

    groups = detect_duplicates([item1, item2], threshold=0.75)
    assert len(groups) >= 1
    assert len(groups[0]["members"]) == 2

def test_validator_rules():
    invalid_prod = {
        "product_id": "",
        "product_name": "X",
        "category": "",
        "price": -50.0,
        "product_url": "httpx://bad-url"
    }
    issues, status = validate_product(invalid_prod)
    assert status == "invalid"
    assert any(i["field"] == "product_id" for i in issues)
    assert any(i["field"] == "price" for i in issues)

    valid_prod = {
        "product_id": "PID-100",
        "product_name": "Siemens SIMOTICS S-1FK7 Servo Motor",
        "brand": "Siemens",
        "category": "Industrial Motors",
        "price": 1250.0,
        "power": "5.5 kW",
        "voltage": "400 V",
        "ip_rating": "IP65",
        "description": "High performance permanent magnet servo motor with integrated resolver."
    }
    issues_v, status_v = validate_product(valid_prod)
    assert status_v == "valid"

def test_quality_scorer():
    prod = {
        "product_id": "PID-1",
        "product_name": "ABB Motor",
        "brand": "ABB",
        "category": "Industrial Motors",
        "subcategory": "Induction Motor",
        "model_number": "M3BP",
        "description": "High efficiency 3-phase motor",
        "price": 1500.0,
        "voltage": "400 V",
        "power": "15.0 kW",
        "weight": "85.0 kg",
        "dimensions": "400 x 300 x 300 mm",
        "ip_rating": "IP55",
        "supplier": "Apex Industrial",
        "product_url": "https://example.com"
    }
    scores = score_product(prod, validation_issues=[])
    assert scores["quality_score"] > 80.0
    assert scores["completeness_score"] == 1.0

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_api_ai_status():
    res = client.get("/api/ai/status")
    assert res.status_code == 200
    assert "status" in res.json()
    assert "model" in res.json()

def test_demo_dataset_and_pipeline():
    # Test triggering pipeline on sample dataset
    res = client.post("/api/sample-datasets/dataset_a/process")
    assert res.status_code == 200
    data = res.json()
    assert "job_id" in data
    job_id = data["job_id"]
    
    # Check job endpoint
    job_res = client.get(f"/api/jobs/{job_id}")
    assert job_res.status_code == 200
    assert job_res.json()["job_id"] == job_id
