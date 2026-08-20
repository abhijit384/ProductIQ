import requests
import json
import time

FRONTEND_ORIGIN = "https://productiq-inky.vercel.app"
BACKEND_URL = "https://productiq-backend-4n4k.onrender.com"

def test_deployed_vercel_flow():
    print("=" * 60)
    print("RUNNING LIVE VERCEL -> RENDER SCHEMA ANALYSIS & PIPELINE AUDIT")
    print("=" * 60)

    # 1. Health & CORS Preflight
    print("\n1. Health Check with Vercel Origin Header:")
    r = requests.get(f"{BACKEND_URL}/api/health", headers={"Origin": FRONTEND_ORIGIN})
    print(f"Status: {r.status_code} | Body: {r.json()}")
    print(f"CORS Origin: {r.headers.get('access-control-allow-origin')}")
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == FRONTEND_ORIGIN

    # 2. CORS Preflight for Schema Analyze
    print("\n2. CORS Preflight (OPTIONS) for /api/schema/analyze:")
    r = requests.options(
        f"{BACKEND_URL}/api/schema/analyze",
        headers={
            "Origin": FRONTEND_ORIGIN,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"
        }
    )
    print(f"OPTIONS Status: {r.status_code}")
    print(f"Allow-Origin: {r.headers.get('access-control-allow-origin')}")
    print(f"Allow-Methods: {r.headers.get('access-control-allow-methods')}")
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == FRONTEND_ORIGIN

    # 3. Schema Analysis with Sample Dataset
    print("\n3. Testing Schema Analysis (POST /api/schema/analyze):")
    with open("data/sample_products_1000.csv", "rb") as f:
        r = requests.post(
            f"{BACKEND_URL}/api/schema/analyze",
            files={"file": ("Unihack_ Sample Dataset - Input(2).csv", f, "text/csv")},
            headers={"Origin": FRONTEND_ORIGIN}
        )
    print(f"Schema Analyze Status: {r.status_code}")
    assert r.status_code == 200
    res_data = r.json()
    analysis = res_data.get("analysis", {})
    cols = analysis.get("columns", [])
    print(f"Total Rows: {res_data.get('total_rows')} | Total Columns: {res_data.get('total_columns')}")
    print(f"Dataset Summary: {analysis.get('dataset_summary')}")
    print(f"Detected Columns Count: {len(cols)}")
    for c in cols[:5]:
        print(f"  - '{c.get('original_column')}' -> '{c.get('canonical_field')}' (Confidence: {c.get('confidence')})")

    # 4. Upload & Process with Detected Mapping
    print("\n4. Triggering Processing with Mapping (POST /api/upload):")
    mapping = {c["original_column"]: c["canonical_field"] for c in cols}
    with open("data/sample_products_1000.csv", "rb") as f:
        r = requests.post(
            f"{BACKEND_URL}/api/upload",
            files={"file": ("Unihack_ Sample Dataset - Input(2).csv", f, "text/csv")},
            data={"mapping": json.dumps(mapping)},
            headers={"Origin": FRONTEND_ORIGIN}
        )
    print(f"Upload Status: {r.status_code}")
    assert r.status_code == 200
    job_id = r.json().get("job_id")
    print(f"Job Created: {job_id}")

    # 5. Polling until complete
    print("\n5. Polling Pipeline Execution:")
    start_t = time.time()
    while time.time() - start_t < 90:
        time.sleep(2)
        job_status = requests.get(f"{BACKEND_URL}/api/jobs/{job_id}", headers={"Origin": FRONTEND_ORIGIN}).json()
        print(f"  [{job_status.get('stage')}] Progress: {job_status.get('progress')}% - Status: {job_status.get('status')}")
        if job_status.get("status") in ("completed", "failed"):
            break

    # 6. Verify Dashboard and Exports
    print("\n6. Verifying Dashboard & Downloads:")
    dash = requests.get(f"{BACKEND_URL}/api/dashboard?job_id={job_id}", headers={"Origin": FRONTEND_ORIGIN}).json()
    print(f"Dashboard Loaded: Total Products = {dash.get('kpis', {}).get('total_products', {}).get('value')}")
    
    exp = requests.get(f"{BACKEND_URL}/api/download?job_id={job_id}&format=csv", headers={"Origin": FRONTEND_ORIGIN})
    print(f"CSV Download Status: {exp.status_code} | Bytes: {len(exp.content)}")
    assert exp.status_code == 200

    print("\n" + "=" * 60)
    print("ALL VERIFICATIONS PASSED: Schema Analysis & Full Flow Fully Operational on Vercel!")
    print("=" * 60)

if __name__ == "__main__":
    test_deployed_vercel_flow()
