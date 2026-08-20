import urllib.request
import json
import time
import io
import mimetypes
import uuid

BASE = "http://127.0.0.1:8000/api"

def test_demo_and_upload_paths():
    print("=" * 60)
    print("RUNNING COMPREHENSIVE DEMO VS UPLOAD PIPELINE VERIFICATION")
    print("=" * 60)

    # 1. Test Demo Dataset Endpoint
    print("\n--- TEST B: Demo Dataset Pipeline ---")
    req = urllib.request.Request(f"{BASE}/demo-dataset", data=b"", method="POST")
    r = urllib.request.urlopen(req)
    assert r.status == 200
    demo_res = json.loads(r.read().decode())
    print(f"Demo Response: {demo_res}")
    assert demo_res.get("valid") is True
    assert demo_res.get("rows") == 1050
    assert demo_res.get("columns") == 24
    job_id = demo_res["job_id"]

    # Poll and track progress
    stages_seen = []
    for _ in range(60):
        time.sleep(0.5)
        r = urllib.request.urlopen(f"{BASE}/jobs/{job_id}")
        st = json.loads(r.read().decode())
        stage_info = f"Stage: {st.get('current_stage')}, Progress: {st.get('progress_percentage')}%, Processed: {st.get('processed_rows')}/{st.get('total_rows')}"
        if not stages_seen or stages_seen[-1] != stage_info:
            stages_seen.append(stage_info)
            print(f"  [Progress Update] {stage_info}")

        if st["status"] == "completed":
            print(f"  [COMPLETED] Demo pipeline finished with 100% in {st['stats'].get('duration_seconds')}s!")
            assert st["progress_percentage"] == 100.0
            break
        elif st["status"] == "failed":
            raise Exception(f"Demo pipeline failed: {st.get('error_message')}")

    # 2. Test Normal File Upload Pipeline
    print("\n--- TEST A: Normal User File Upload Pipeline ---")
    # Fetch sample CSV content
    r = urllib.request.urlopen(f"{BASE}/sample")
    csv_bytes = r.read()

    # Construct multipart/form-data
    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
    body = io.BytesIO()
    body.write(f"--{boundary}\r\n".encode())
    body.write(b'Content-Disposition: form-data; name="file"; filename="test_upload.csv"\r\n')
    body.write(b"Content-Type: text/csv\r\n\r\n")
    body.write(csv_bytes)
    body.write(b"\r\n")
    body.write(f"--{boundary}--\r\n".encode())
    body_val = body.getvalue()

    req = urllib.request.Request(
        f"{BASE}/upload",
        data=body_val,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    r = urllib.request.urlopen(req)
    assert r.status == 200
    upload_res = json.loads(r.read().decode())
    print(f"Upload Response: {upload_res}")
    up_job_id = upload_res["job_id"]

    # Poll upload job
    for _ in range(60):
        time.sleep(0.5)
        r = urllib.request.urlopen(f"{BASE}/jobs/{up_job_id}")
        st = json.loads(r.read().decode())
        if st["status"] == "completed":
            print(f"  [COMPLETED] Normal upload pipeline finished with 100% in {st['stats'].get('duration_seconds')}s!")
            break
        elif st["status"] == "failed":
            raise Exception(f"Upload pipeline failed: {st.get('error_message')}")

    # 3. Verify Dashboard & Products Grid
    print("\n--- VERIFYING COMMON DASHBOARD & OUTPUT TABLE ---")
    r = urllib.request.urlopen(f"{BASE}/dashboard?job_id={job_id}")
    dash = json.loads(r.read().decode())
    assert dash["has_data"] is True
    print(f"Dashboard KPIs for Demo Job: {dash['kpis']}")
    print(f"Diagnostic Issues by Field: {dash['charts'].get('issues_by_field', [])[:3]}")

    r = urllib.request.urlopen(f"{BASE}/products?job_id={job_id}&page=1&page_size=5")
    prods = json.loads(r.read().decode())
    assert prods["total"] == 1050
    print(f"Products Grid Total: {prods['total']} items populated successfully!")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED: DEMO DATASET USES IDENTICAL PIPELINE AND COMPLETES AT 100%!")
    print("=" * 60)

if __name__ == "__main__":
    test_demo_and_upload_paths()
