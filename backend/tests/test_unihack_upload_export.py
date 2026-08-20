import io
import os
import time
import httpx
import pandas as pd

BASE_URL = "http://127.0.0.1:8000/api"

EXPECTED_COLUMNS = [
    "Product ID",
    "Product Name",
    "Brand",
    "Category",
    "Subcategory",
    "Model Number",
    "Price",
    "Currency",
    "Voltage",
    "Power",
    "Frequency",
    "RPM",
    "Weight",
    "Dimensions",
    "IP Rating",
    "Material",
    "Warranty",
    "Supplier",
    "Source",
    "Quality Score",
    "AI Confidence %",
    "Validation Status",
    "Cleaned Description",
    "Product URL"
]

def test_unihack_dataset_upload_and_export():
    print("=" * 75)
    print("TEST: Upload 'Unihack_ Sample Dataset - Input(2).csv' and Verify Export")
    print("=" * 75)

    # 1. Create a representative input dataset
    sample_data = """Mfg_Part_Num,Part_Desc,E1_Brand,Part_Manuf,Price,Voltage,Power,Weight
ABB-MTR-384,Three-Phase Heavy Duty Induction Motor 15kW 400V IP55,ABB,ABB,1450.00,400V,15kW,120 kg
SIM-PLC-900,SIMATIC S7-1500 Modular Programmable Logic Controller CPU 1516-3,Siemens,Siemens,2890.50,24V DC,50W,1.8 kg
WEG-W22-120,WEG W22 High Efficiency Electric Motor 7.5 kW 400/690V,WEG,WEG,980.00,400/690V,7.5 kW,65 kg
XYL-PMP-792,Stainless Steel Submersible Slurry Pump 11kW 1450 RPM,Xylem,Xylem,3200.00,400 V,11 kW,140 kg
VEL-VLV-130,High Performance Pneumatic Ball Valve ANSI 150 DN50,Velan,Velan,450.00,24V DC,20W,8.5 kg
SIC-SNS-674,Optoelectronic Industrial Distance Sensor 24V DC IP67,Sick,Sick,310.00,24 V DC,5 W,0.4 kg
TIM-BRG-384,Heavy Duty Spherical Roller Bearing 80mm Bore,Timken,Timken,195.00,,,,4.2 kg
KAE-CMP-259,Rotary Screw Air Compressor 45kW 8.5 bar,Kaeser,Kaeser,8500.00,400 V,45 kW,620 kg
EUC-SFT-982,Safety Interlock Guard Locking Switch 24V Ex d,Euchner,Euchner,280.00,24 V DC,10 W,1.2 kg
FLO-PMP-786,Centrifugal Chemical Process Pump Cast Iron GG25,Flowserve,Flowserve,4100.00,400 V,18.5 kW,195 kg"""

    filename = "Unihack_ Sample Dataset - Input(2).csv"
    
    # 2. Upload file via /api/upload
    print(f"\n[Step 1] Uploading '{filename}' ({len(sample_data.strip().splitlines()) - 1} rows)...")
    files = {
        'file': (filename, sample_data.encode('utf-8'), 'text/csv')
    }
    r_upload = httpx.post(f"{BASE_URL}/upload", files=files)
    assert r_upload.status_code == 200, f"Upload failed: {r_upload.text}"
    job_id = r_upload.json()["job_id"]
    print(f" -> Job created: {job_id}")

    # 3. Wait for background processing to complete
    print("\n[Step 2] Processing dataset through ProductIQ intelligence pipeline...")
    start_t = time.time()
    total_uploaded_rows = 0
    while time.time() - start_t < 25:
        r_job = httpx.get(f"{BASE_URL}/jobs/{job_id}")
        assert r_job.status_code == 200
        job_info = r_job.json()
        st = job_info.get("status")
        stage = job_info.get("stage", job_info.get("current_stage"))
        prog = job_info.get("progress", job_info.get("progress_percentage"))
        total_uploaded_rows = job_info.get("total", job_info.get("total_rows", 0))
        print(f"   ... Stage: {stage} ({prog}%) Status: {st}")
        if st in ["completed", "failed"]:
            break
        time.sleep(0.5)

    assert st == "completed", f"Pipeline failed: {job_info}"
    print(f" -> Pipeline completed in {round(time.time() - start_t, 2)}s!")

    # 4. Trigger Export via GET /api/download
    print("\n[Step 3] Exporting processed output via GET /api/download...")
    r_export = httpx.get(f"{BASE_URL}/download?job_id={job_id}")
    assert r_export.status_code == 200, f"Export download failed: {r_export.text}"
    assert "text/csv" in r_export.headers.get("content-type", "")
    
    disp = r_export.headers.get("content-disposition", "")
    print(f" -> Content-Disposition: {disp}")
    assert "ProductIQ_Enriched_Output.csv" in disp

    # 5. Verify CSV content & delivery format
    print("\n[Step 4] Validating Exported CSV Structure & Delivery Format...")
    df = pd.read_csv(io.StringIO(r_export.text))
    print(f" -> Exported Rows Count: {len(df)}")
    print(f" -> Uploaded Rows Count: {total_uploaded_rows}")
    assert len(df) == total_uploaded_rows, f"Row count mismatch! Exported {len(df)} vs Uploaded {total_uploaded_rows}"
    assert len(df) == 10, "Expected exactly 10 products"
    print(" [PASS] 100% of uploaded rows are present in the export.")

    print(f" -> Exported Columns ({len(df.columns)}): {list(df.columns)}")
    assert list(df.columns) == EXPECTED_COLUMNS, f"Columns mismatch! Found: {list(df.columns)}"
    print(" [PASS] Exact delivery format column names and order match.")

    # 6. Verify column content
    print("\n[Step 5] Checking Sample Rows...")
    for i in range(min(3, len(df))):
        row = df.iloc[i]
        print(f"  Row {i+1}: ID={row['Product ID']} | Name={row['Product Name'][:40]} | Brand={row['Brand']} | Power={row['Power']} | Score={row['Quality Score']}")
        assert row["Product ID"] != "", f"Empty Product ID at row {i}"
        assert row["Brand"] != "", f"Empty Brand at row {i}"
        assert row["Category"] != "", f"Empty Category at row {i}"

    print("\n" + "=" * 75)
    print("SUCCESS: 'Unihack_ Sample Dataset - Input(2).csv' PROCESSED AND EXPORTED PERFECTLY!")
    print("=" * 75)

if __name__ == "__main__":
    test_unihack_dataset_upload_and_export()
