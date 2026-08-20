import requests
import time

API_URL = "http://127.0.0.1:8000/api"
DATASET_PATH = "d:/ProductIQ/data/user_supplied_dataset.csv"

def test_user_dataset():
    print("Uploading user_supplied_dataset.csv (441 rows)...")
    with open(DATASET_PATH, "rb") as f:
        res = requests.post(f"{API_URL}/upload", files={"file": ("user_supplied_dataset.csv", f, "text/csv")})
    
    assert res.status_code == 200, f"Upload failed: {res.text}"
    job_id = res.json()["job_id"]
    print(f"Uploaded! Job ID: {job_id}")

    # Poll status
    for i in range(30):
        time.sleep(1)
        st = requests.get(f"{API_URL}/jobs/{job_id}").json()
        print(f"Status: {st['status']} ({st['progress']}%) - Stage: {st['stage']}")
        if st["status"] in ("completed", "failed"):
            break

    assert st["status"] == "completed", f"Job failed: {st}"
    print("Processing complete!")

    # Check products count
    prods = requests.get(f"{API_URL}/products", params={"job_id": job_id, "page": 1, "page_size": 25}).json()
    print(f"Total Products in DB: {prods['total']}")
    assert prods["total"] > 0, "No products returned!"

    # Test export
    exp = requests.get(f"{API_URL}/download", params={"job_id": job_id})
    assert exp.status_code == 200, "Download failed"
    lines = exp.text.strip().split("\n")
    print(f"Exported rows: {len(lines) - 1}")
    print("Headers:", lines[0][:120], "...")

    print("ALL CHECKS PASSED FOR USER-SUPPLIED DATASET!")
    return job_id

if __name__ == "__main__":
    test_user_dataset()
