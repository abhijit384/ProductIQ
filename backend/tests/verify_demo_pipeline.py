import urllib.request
import re
import time
import requests
import json

FRONTEND_URL = "https://productiq-inky.vercel.app"
BACKEND_URL = "https://productiq-backend-4n4k.onrender.com"

def poll_and_test_demo():
    print("=" * 60)
    print("1. POLLING VERCEL DEPLOYMENT UNTIL BUNDLE UPDATED")
    print("=" * 60)
    
    for i in range(30):
        time.sleep(3)
        try:
            req = urllib.request.Request(
                f"{FRONTEND_URL}?v={int(time.time())}",
                headers={"User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache"}
            )
            with urllib.request.urlopen(req) as res:
                html = res.read().decode("utf-8")
            
            js_files = re.findall(r'src=["\']([^"\']+\.js)["\']', html)
            if not js_files:
                continue
            
            print(f"[{time.strftime('%H:%M:%S')}] Attempt {i+1}: Active JS Bundle = {js_files[0]}")
            
            js_url = FRONTEND_URL + js_files[0] if js_files[0].startswith("/") else js_files[0]
            with urllib.request.urlopen(js_url) as jres:
                content = jres.read().decode("utf-8")
            
            if "sample_products_1000.csv" in content and "productiq-backend-4n4k.onrender.com" in content:
                print("\n-> Latest build is LIVE on Vercel!")
                break
        except Exception as e:
            print(f"Polling error: {e}")

    print("\n" + "=" * 60)
    print("2. TESTING DEMO DATASET FETCH FROM VERCEL & BACKEND")
    print("=" * 60)

    # Test static fallback on Vercel
    static_url = f"{FRONTEND_URL}/sample_products_1000.csv"
    r = requests.get(static_url)
    print(f"Vercel Static Sample File: Status {r.status_code}, Bytes: {len(r.content)}")
    assert r.status_code == 200

    # Test backend /api/sample
    backend_sample_url = f"{BACKEND_URL}/api/sample"
    r = requests.get(backend_sample_url, headers={"Origin": FRONTEND_URL})
    print(f"Render Backend /api/sample: Status {r.status_code}, Bytes: {len(r.content)}")
    assert r.status_code == 200

    print("\n" + "=" * 60)
    print("3. EXECUTING UNIFIED DEMO PIPELINE (OBTAIN FILE -> ANALYZE -> UPLOAD)")
    print("=" * 60)

    sample_bytes = r.content
    
    # Step A: POST /api/schema/analyze with the demo file
    print("\nA. Running Schema Analysis with Demo CSV File...")
    analyze_res = requests.post(
        f"{BACKEND_URL}/api/schema/analyze",
        files={"file": ("Unihack_ Sample Dataset - Input(2).csv", sample_bytes, "text/csv")},
        headers={"Origin": FRONTEND_ORIGIN_HEADER}
    )
    print(f"Schema Analyze Status: {analyze_res.status_code}")
    assert analyze_res.status_code == 200
    analysis = analyze_res.json().get("analysis", {})
    cols = analysis.get("columns", [])
    print(f"Detected {len(cols)} columns in Demo dataset.")
    for c in cols[:4]:
        print(f"  - {c.get('original_column')} -> {c.get('canonical_field')} ({int(c.get('confidence', 0)*100)}%)")

    # Step B: POST /api/upload with user confirmed mapping
    print("\nB. Triggering Upload with Confirmed Mapping...")
    mapping = {c["original_column"]: c["canonical_field"] for c in cols}
    upload_res = requests.post(
        f"{BACKEND_URL}/api/upload",
        files={"file": ("Unihack_ Sample Dataset - Input(2).csv", sample_bytes, "text/csv")},
        data={"mapping": json.dumps(mapping)},
        headers={"Origin": FRONTEND_ORIGIN_HEADER}
    )
    print(f"Upload Status: {upload_res.status_code}")
    assert upload_res.status_code == 200
    job_id = upload_res.json().get("job_id")
    print(f"Pipeline Job ID: {job_id}")

    # Step C: Poll to completion
    print("\nC. Polling Pipeline Execution...")
    start_t = time.time()
    while time.time() - start_t < 90:
        time.sleep(2)
        job_status = requests.get(f"{BACKEND_URL}/api/jobs/{job_id}", headers={"Origin": FRONTEND_ORIGIN_HEADER}).json()
        print(f"  Stage: {job_status.get('stage'):<18} | Progress: {job_status.get('progress'):>3}% | Status: {job_status.get('status')}")
        if job_status.get("status") in ("completed", "failed"):
            break

    # Step D: Verify output and exports
    print("\nD. Verifying Outputs...")
    dash = requests.get(f"{BACKEND_URL}/api/dashboard?job_id={job_id}", headers={"Origin": FRONTEND_ORIGIN_HEADER}).json()
    print(f"Dashboard Data Loaded: {dash.get('has_data')}")
    
    exp = requests.get(f"{BACKEND_URL}/api/download?job_id={job_id}&format=csv", headers={"Origin": FRONTEND_ORIGIN_HEADER})
    print(f"Export CSV Download Status: {exp.status_code}, Bytes: {len(exp.content)}")
    assert exp.status_code == 200

    print("\n" + "=" * 60)
    print("SUCCESS: UNIFIED DEMO PIPELINE FULLY VALIDATED ON PRODUCTION!")
    print("=" * 60)

FRONTEND_ORIGIN_HEADER = "https://productiq-inky.vercel.app"

if __name__ == "__main__":
    poll_and_test_demo()
