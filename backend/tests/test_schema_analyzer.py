import pytest
import asyncio
from backend.ai.schema_analyzer import schema_analyzer, CANONICAL_SCHEMA

def test_canonical_schema_definitions():
    assert "product_identifier" in CANONICAL_SCHEMA
    assert "mpn" in CANONICAL_SCHEMA
    assert "sku" in CANONICAL_SCHEMA
    assert "product_name" in CANONICAL_SCHEMA
    assert "product_description" in CANONICAL_SCHEMA
    assert "brand" in CANONICAL_SCHEMA
    assert "manufacturer" in CANONICAL_SCHEMA
    assert "supplier" in CANONICAL_SCHEMA
    assert "voltage" in CANONICAL_SCHEMA
    assert "power" in CANONICAL_SCHEMA
    assert "additional_attributes" in CANONICAL_SCHEMA

def test_fingerprint_caching():
    headers = ["Mfg_Part_Num", "Part_Desc", "E1_Brand", "Part_Manuf"]
    sample_rows = [
        {"Mfg_Part_Num": "ABB-MTR-384", "Part_Desc": "Heavy Duty Motor 15kW", "E1_Brand": "ABB", "Part_Manuf": "ABB"},
        {"Mfg_Part_Num": "SIM-PLC-900", "Part_Desc": "SIMATIC S7-1500", "E1_Brand": "Siemens", "Part_Manuf": "Siemens"}
    ]
    fp1 = schema_analyzer.compute_fingerprint(headers, sample_rows)
    fp2 = schema_analyzer.compute_fingerprint(headers, sample_rows)
    assert fp1 == fp2
    assert len(fp1) == 64

@pytest.mark.asyncio
async def test_dataset_a_schema_detection():
    headers = ["Mfg_Part_Num", "Part_Desc", "E1_Brand", "Part_Manuf"]
    sample_rows = [
        {"Mfg_Part_Num": "ABB-MTR-384", "Part_Desc": "Three-Phase Heavy Duty Induction Motor 15kW", "E1_Brand": "ABB", "Part_Manuf": "ABB"},
        {"Mfg_Part_Num": "SIM-PLC-900", "Part_Desc": "SIMATIC S7-1500 Modular PLC", "E1_Brand": "Siemens", "Part_Manuf": "Siemens"},
        {"Mfg_Part_Num": "XYL-PMP-792", "Part_Desc": "Stainless Steel Submersible Pump", "E1_Brand": "Xylem", "Part_Manuf": "Xylem"}
    ]
    res = await schema_analyzer.analyze_schema(headers, sample_rows, 3, "Dataset A")
    assert res["total_columns"] == 4
    col_map = {c["original_column"]: c["canonical_field"] for c in res["columns"]}
    
    assert col_map["Mfg_Part_Num"] in ("mpn", "product_identifier")
    assert col_map["Part_Desc"] in ("product_description", "product_name")
    assert col_map["E1_Brand"] == "brand"
    assert col_map["Part_Manuf"] == "manufacturer"

@pytest.mark.asyncio
async def test_dataset_b_schema_detection():
    headers = ["SKU", "Item_Name", "Maker", "Supplier", "Price"]
    sample_rows = [
        {"SKU": "SKU-9901", "Item_Name": "Leroy-Somer AC Motor", "Maker": "Nidec", "Supplier": "Nordic Hub", "Price": "3450.00"},
        {"SKU": "SKU-9902", "Item_Name": "Modicon M580 Ethernet PAC", "Maker": "Schneider Electric", "Supplier": "TechFlow", "Price": "2890.50"}
    ]
    res = await schema_analyzer.analyze_schema(headers, sample_rows, 2, "Dataset B")
    assert res["total_columns"] == 5
    col_map = {c["original_column"]: c["canonical_field"] for c in res["columns"]}
    
    assert col_map["SKU"] in ("sku", "product_identifier")
    assert col_map["Item_Name"] == "product_name"
    assert col_map["Maker"] in ("manufacturer", "brand")
    assert col_map["Supplier"] == "supplier"
    assert col_map["Price"] == "price"

@pytest.mark.asyncio
async def test_dataset_c_schema_detection():
    headers = ["ProductCode", "LongDescription", "ManufacturerName", "BrandName", "VoltageRating", "WeightKg"]
    sample_rows = [
        {"ProductCode": "PRD-ENG-101", "LongDescription": "Baldor Severe Duty Motor 20 HP", "ManufacturerName": "Baldor", "BrandName": "Baldor", "VoltageRating": "460 V AC", "WeightKg": "142.5"},
        {"ProductCode": "PRD-ENG-102", "LongDescription": "Mitsubishi MELSEC iQ-R CPU", "ManufacturerName": "Mitsubishi", "BrandName": "Mitsubishi", "VoltageRating": "24 V DC", "WeightKg": "1.8"}
    ]
    res = await schema_analyzer.analyze_schema(headers, sample_rows, 2, "Dataset C")
    assert res["total_columns"] == 6
    col_map = {c["original_column"]: c["canonical_field"] for c in res["columns"]}
    
    assert col_map["ProductCode"] in ("product_identifier", "mpn", "sku")
    assert col_map["LongDescription"] in ("product_description", "product_name")
    assert col_map["ManufacturerName"] == "manufacturer"
    assert col_map["BrandName"] == "brand"
    assert col_map["VoltageRating"] == "voltage"
    assert col_map["WeightKg"] == "weight"

def test_cross_check_numeric_contradiction():
    # If header sounds like Maker/MFR but values are numbers (12.5, 15, 22), cross-check should correct it
    samples = ["12.5", "15.0", "22.5", "7.5"]
    corrected_field, conf, ev = schema_analyzer._cross_check_and_validate("MFR", "manufacturer", 0.85, "Header match", samples)
    assert corrected_field != "manufacturer"
    assert corrected_field in ("additional_attributes", "power")
