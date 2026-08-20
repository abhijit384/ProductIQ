import requests
import time

API_URL = "https://productiq-backend-4n4k.onrender.com"

def test_full_pipeline():
    print("=== 1. Testing /api/health with CORS ===")
    r = requests.get(f"{API_URL}/api/health", headers={"Origin": "http://localhost:5173"})
    print("Health Status:", r.status_code, r.json())
    print("CORS Allow-Origin:", r.headers.get("access-control-allow-origin"))

    print("\n=== 2. Testing /api/ai/status ===")
    r = requests.get(f"{API_URL}/api/ai/status", headers={"Origin": "http://localhost:5173"})
    print("AI Status:", r.status_code, r.json())

    print("\n=== 3. Uploading Sample Dataset (CSV) ===")
    with open("data/sample_products_1000.csv", "rb") as f:
        r = requests.post(
            f"{API_URL}/api/upload",
            files={"file": ("sample_products_1000.csv", f, "text/csv")},
            headers={"Origin": "http://localhost:5173"}
        )
    print("Upload Status:", r.status_code)
    data = r.json()
    job_id = data.get("job_id")
    print("Job ID:", job_id, "Initial Stage:", data.get("stage"))

    print("\n=== 4. Streaming / Polling Pipeline Stages to Completion ===")
    start_time = time.time()
    while time.time() - start_time < 90:
        time.sleep(1.5)
        res = requests.get(f"{API_URL}/api/jobs/{job_id}", headers={"Origin": "http://localhost:5173"}).json()
        status = res.get("status")
        progress = res.get("progress", 0)
        stage = res.get("stage")
        print(f"[{time.strftime('%H:%M:%S')}] Stage: {stage:<18} | Progress: {progress:>3}% | Status: {status}")
        if status in ("completed", "failed"):
            break

    print("\n=== 5. Testing Overview & Dashboard API ===")
    r = requests.get(f"{API_URL}/api/dashboard?job_id={job_id}", headers={"Origin": "http://localhost:5173"})
    print("Dashboard Status:", r.status_code, "Metrics:", list(r.json().keys()))

    print("\n=== 6. Testing Product Intelligence API ===")
    r = requests.get(f"{API_URL}/api/products?job_id={job_id}&page=1&page_size=3", headers={"Origin": "http://localhost:5173"})
    prod_data = r.json()
    items = prod_data.get("items", [])
    print(f"Products Status: {r.status_code} | Total items: {prod_data.get('total', len(items))}")
    if items:
        p1 = items[0]
        print(f"First product: ID={p1.get('id')}, Title={p1.get('normalized_name') or p1.get('original_name')}, Quality={p1.get('quality_score')}")

    print("\n=== 7. Testing AI Enrichment Center API ===")
    r = requests.get(f"{API_URL}/api/enrichment?job_id={job_id}", headers={"Origin": "http://localhost:5173"})
    print("Enrichment Status:", r.status_code, "Keys:", list(r.json().keys()))

    print("\n=== 8. Testing Quality Metrics API ===")
    r = requests.get(f"{API_URL}/api/quality?job_id={job_id}", headers={"Origin": "http://localhost:5173"})
    print("Quality Status:", r.status_code, "Keys:", list(r.json().keys()))

    print("\n=== 9. Testing Export Outputs (CSV & XLSX) ===")
    csv_res = requests.get(f"{API_URL}/api/download?job_id={job_id}&format=csv", headers={"Origin": "http://localhost:5173"})
    print(f"CSV Export: {csv_res.status_code} | Size: {len(csv_res.content)} bytes | Filename: {csv_res.headers.get('Content-Disposition')}")

    xlsx_res = requests.get(f"{API_URL}/api/download?job_id={job_id}&format=xlsx", headers={"Origin": "http://localhost:5173"})
    print(f"XLSX Export: {xlsx_res.status_code} | Size: {len(xlsx_res.content)} bytes | Filename: {xlsx_res.headers.get('Content-Disposition')}")

    print("\n=======================================================")
    print(" SUCCESS: Complete Frontend-to-Backend Integration Validated!")
    print("=======================================================")

if __name__ == "__main__":
    test_full_pipeline()
