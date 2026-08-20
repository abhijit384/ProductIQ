import io
import time
import httpx
import pandas as pd

BASE_URL = "http://127.0.0.1:8000/api"

EXPECTED_DELIVERY_COLUMNS = [
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

def test_export_pipeline():
    print("=" * 70)
    print("PRODUCTIQ — EXPORT & DELIVERY FORMAT VERIFICATION SUITE")
    print("=" * 70)

    # 1. Trigger Demo Dataset processing
    print("\n[1/4] Triggering Demo Catalog Processing Pipeline...")
    r_demo = httpx.post(f"{BASE_URL}/demo-dataset")
    assert r_demo.status_code == 200, f"Demo trigger failed: {r_demo.text}"
    job_id = r_demo.json()["job_id"]
    print(f" -> Job ID: {job_id}")

    # Wait for completion
    print(" -> Waiting for pipeline to conclude...")
    start_t = time.time()
    total_rows = 0
    while time.time() - start_t < 20:
        r_job = httpx.get(f"{BASE_URL}/jobs/{job_id}")
        assert r_job.status_code == 200
        data = r_job.json()
        st = data.get("status")
        total_rows = data.get("total", data.get("total_rows", 0))
        if st in ["completed", "failed"]:
            break
        time.sleep(1)

    print(f" -> Job Status: {st} (Total Uploaded Rows: {total_rows})")
    assert st == "completed", f"Job failed: {data}"

    # 2. Test GET /api/download endpoint
    print("\n[2/4] Testing GET /api/download endpoint...")
    r_dl = httpx.get(f"{BASE_URL}/download?job_id={job_id}")
    assert r_dl.status_code == 200, f"Download failed: {r_dl.text}"
    assert "text/csv" in r_dl.headers.get("content-type", "")
    disp = r_dl.headers.get("content-disposition", "")
    print(f" -> Content-Disposition: {disp}")
    assert "ProductIQ_Enriched_Output.csv" in disp, f"Expected filename not found in {disp}"

    # 3. Parse CSV and Validate Columns & Row Count
    print("\n[3/4] Validating Exported CSV Structure & Row Count...")
    csv_text = r_dl.text
    df = pd.read_csv(io.StringIO(csv_text))
    
    print(f" -> Exported Rows Count: {len(df)}")
    print(f" -> Total Uploaded Rows: {total_rows}")
    assert len(df) == total_rows, f"Row count mismatch! Exported {len(df)} vs Uploaded {total_rows}"
    print(f" [PASS] COMPLETE dataset exported: exact {len(df)}/{total_rows} rows.")

    print(f" -> Exported Columns ({len(df.columns)}): {list(df.columns)}")
    print(f" -> Expected Columns ({len(EXPECTED_DELIVERY_COLUMNS)}): {EXPECTED_DELIVERY_COLUMNS}")

    # Verify column existence and order
    assert list(df.columns) == EXPECTED_DELIVERY_COLUMNS, f"Columns mismatch! Found: {list(df.columns)}"
    print(" [PASS] Exact expected delivery format column names and order confirmed!")

    # Check sample values
    print("\n[4/4] Verifying Sample Data Integrity & AI Enrichment Values...")
    first_row = df.iloc[0].to_dict()
    print(" -> Sample Record 1:")
    for k, v in first_row.items():
        print(f"    {k:20s}: {v}")

    assert first_row["Product ID"] != "", "Product ID is empty"
    assert first_row["Product Name"] != "", "Product Name is empty"
    assert first_row["Brand"] != "", "Brand is empty"
    assert first_row["Category"] != "", "Category is empty"
    assert first_row["Quality Score"] != "", "Quality Score is empty"
    assert first_row["Validation Status"] in ["valid", "warning", "invalid"]

    print("\n" + "=" * 70)
    print("ALL EXPORT BACKEND VERIFICATION CHECKS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_export_pipeline()
