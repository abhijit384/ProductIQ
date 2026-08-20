import os
import json
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api_sample_datasets_list():
    res = client.get("/api/sample-datasets")
    assert res.status_code == 200
    data = res.json()
    assert "datasets" in data
    assert len(data["datasets"]) >= 4
    preset_ids = [d["id"] for d in data["datasets"]]
    assert "dataset_a" in preset_ids
    assert "dataset_b" in preset_ids
    assert "dataset_c" in preset_ids
    assert "demo_1000" in preset_ids

def test_api_analyze_dataset_a():
    res = client.post("/api/sample-datasets/dataset_a/analyze")
    assert res.status_code == 200
    data = res.json()
    analysis = data["analysis"]
    assert analysis["total_columns"] == 4
    col_map = {c["original_column"]: c["canonical_field"] for c in analysis["columns"]}
    assert "Mfg_Part_Num" in col_map
    assert "Part_Desc" in col_map
    assert "E1_Brand" in col_map
    assert "Part_Manuf" in col_map
    assert col_map["E1_Brand"] == "brand"
    assert col_map["Part_Manuf"] == "manufacturer"

def test_api_analyze_dataset_b():
    res = client.post("/api/sample-datasets/dataset_b/analyze")
    assert res.status_code == 200
    data = res.json()
    analysis = data["analysis"]
    assert analysis["total_columns"] == 5
    col_map = {c["original_column"]: c["canonical_field"] for c in analysis["columns"]}
    assert col_map["SKU"] in ("sku", "product_identifier")
    assert col_map["Item_Name"] == "product_name"
    assert col_map["Price"] == "price"

def test_api_analyze_dataset_c():
    res = client.post("/api/sample-datasets/dataset_c/analyze")
    assert res.status_code == 200
    data = res.json()
    analysis = data["analysis"]
    assert analysis["total_columns"] == 6
    col_map = {c["original_column"]: c["canonical_field"] for c in analysis["columns"]}
    assert col_map["VoltageRating"] == "voltage"
    assert col_map["WeightKg"] == "weight"

def test_api_upload_custom_csv():
    csv_data = (
        "ItemCode,ItemTitle,VendorName,PowerRating\n"
        "ITM-001,Electric Motor 15kW,ABB,15 kW\n"
        "ITM-002,Process Pump 5HP,KSB,5 HP\n"
    )
    files = {"file": ("custom_catalog.csv", csv_data.encode("utf-8"), "text/csv")}
    res = client.post("/api/schema/analyze", files=files)
    assert res.status_code == 200
    data = res.json()
    analysis = data["analysis"]
    col_map = {c["original_column"]: c["canonical_field"] for c in analysis["columns"]}
    assert col_map["ItemCode"] in ("product_identifier", "sku", "mpn")
    assert col_map["ItemTitle"] in ("product_name", "product_description")
    assert col_map["PowerRating"] == "power"

if __name__ == "__main__":
    print("Running verification...")
    test_api_sample_datasets_list()
    test_api_analyze_dataset_a()
    test_api_analyze_dataset_b()
    test_api_analyze_dataset_c()
    test_api_upload_custom_csv()
    print("All multi-dataset API verification tests passed successfully!")
