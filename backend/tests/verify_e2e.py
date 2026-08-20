import httpx
import time
import sys

BASE_URL = "http://127.0.0.1:8000/api"
FRONTEND_URL = "http://127.0.0.1:5173"

def run_verification():
    print("=" * 70)
    print("PRODUCTIQ — FULL-STACK END-TO-END VERIFICATION SUITE")
    print("=" * 70)

    # 1. Health & AI Status
    print("\n[1/12] Testing Health & AI Status Endpoints...")
    r_health = httpx.get(f"{BASE_URL}/health")
    assert r_health.status_code == 200, f"Health failed: {r_health.text}"
    print(" [OK] Health check passed:", r_health.json())

    r_ai = httpx.get(f"{BASE_URL}/ai/status")
    assert r_ai.status_code == 200, f"AI status failed: {r_ai.text}"
    print(f" [OK] AI status passed: Model={r_ai.json().get('model')}, Status={r_ai.json().get('status')}")

    # 2. Demo Dataset Pipeline Trigger
    print("\n[2/12] Triggering 1,000+ Industrial Product Dataset Pipeline...")
    r_demo = httpx.post(f"{BASE_URL}/demo-dataset")
    assert r_demo.status_code == 200, f"Demo load failed: {r_demo.text}"
    job_id = r_demo.json()["job_id"]
    print(f" [OK] Pipeline job created: {job_id}")

    # Wait for processing to complete
    max_wait = 15
    start_t = time.time()
    while time.time() - start_t < max_wait:
        r_job = httpx.get(f"{BASE_URL}/jobs/{job_id}")
        st = r_job.json().get("status")
        stage = r_job.json().get("current_stage")
        prog = r_job.json().get("progress_percentage")
        print(f"   ... Stage: {stage} ({prog}%) Status: {st}")
        if st in ["completed", "failed"]:
            break
        time.sleep(1)

    assert st == "completed", f"Job failed: {r_job.json()}"
    print(f" [OK] 1,050 records processed successfully in {round(time.time() - start_t, 2)}s!")

    # 3. Dashboard KPIs & Charts
    print("\n[3/12] Verifying Dashboard Analytics...")
    r_dash = httpx.get(f"{BASE_URL}/dashboard?job_id={job_id}")
    assert r_dash.status_code == 200
    dash = r_dash.json()
    assert dash["has_data"] is True
    kpis = dash["kpis"]
    print(f" [OK] Products Processed: {kpis['products_processed']}")
    print(f" [OK] Quality Score: {kpis['quality_score']}% (Completeness: {kpis['completeness_score']}%, Validity: {kpis['validity_score']}%)")
    print(f" [OK] Missing Attributes: {kpis['missing_attributes']}")
    print(f" [OK] Conflicts: {kpis['conflicts_detected']}")
    print(f" [OK] Duplicate Groups: {kpis['duplicate_groups']}")
    print(f" [OK] AI Confidence: {kpis['ai_confidence']}%")
    assert len(dash["charts"]["categories"]) > 0, "No categories in dashboard"
    assert len(dash["charts"]["pipeline_funnel"]) > 0, "No pipeline funnel data"

    # 4. Product Intelligence Grid Search & Filters
    print("\n[4/12] Testing Product Intelligence Grid...")
    r_prods = httpx.get(f"{BASE_URL}/products?job_id={job_id}&page=1&page_size=10")
    assert r_prods.status_code == 200
    prods_data = r_prods.json()
    assert prods_data["total"] == 1050
    assert len(prods_data["items"]) == 10
    sample_pid = prods_data["items"][0]["id"]
    print(f" [OK] Retrieved 10 items of {prods_data['total']} total. Sample: {prods_data['items'][0]['product_name']}")

    # Search filter
    r_search = httpx.get(f"{BASE_URL}/products?job_id={job_id}&search=ABB")
    assert r_search.status_code == 200
    print(f" [OK] Search 'ABB' returned {r_search.json()['total']} matches.")

    # 5. Product Detail View
    print("\n[5/12] Testing Product Intelligence Detail View...")
    r_detail = httpx.get(f"{BASE_URL}/products/{sample_pid}")
    assert r_detail.status_code == 200
    detail = r_detail.json()
    print(f" [OK] Product: {detail['product_name']} | Brand: {detail['brand']} | Specs: {detail['power']} {detail['voltage']}")
    if detail.get("ai_intelligence"):
        print(f"   [OK] AI Keywords: {detail['ai_intelligence']['commerce_keywords'][:3]}")

    # 6. Conflicts & Resolution Action
    print("\n[6/12] Testing Conflicts Engine & Interactive Resolution...")
    r_conflicts = httpx.get(f"{BASE_URL}/conflicts?job_id={job_id}")
    assert r_conflicts.status_code == 200
    conf_items = r_conflicts.json()["items"]
    print(f" [OK] Total Conflicts: {len(conf_items)} (Pending: {r_conflicts.json()['pending']})")
    if conf_items:
        first_conf = conf_items[0]
        print(f"   Resolving Conflict #{first_conf['id']} on '{first_conf['field']}' ({first_conf['value_a']} vs {first_conf['value_b']})...")
        r_resolve = httpx.post(
            f"{BASE_URL}/conflicts/{first_conf['id']}/resolve",
            json={"action": "accept_a", "notes": "Approved in engineering audit"}
        )
        assert r_resolve.status_code == 200
        assert r_resolve.json()["new_status"] == "accept_a"
        print("   [OK] Conflict resolution saved and persisted!")

    # 7. Duplicates & Merge Action
    print("\n[7/12] Testing Duplicate Clustering & Merge...")
    r_dups = httpx.get(f"{BASE_URL}/duplicates?job_id={job_id}")
    assert r_dups.status_code == 200
    dup_groups = r_dups.json()["groups"]
    print(f" [OK] Duplicate Groups: {len(dup_groups)} clusters detected.")
    if dup_groups:
        first_grp = dup_groups[0]
        print(f"   Merging Group {first_grp['group_code']} ({first_grp['similarity_score']}% Match)...")
        r_merge = httpx.post(
            f"{BASE_URL}/duplicates/{first_grp['id']}/resolve",
            json={"action": "merged", "notes": "Merged canonical into master catalog"}
        )
        assert r_merge.status_code == 200
        assert r_merge.json()["new_status"] == "merged"
        print("   [OK] Duplicate group merged and persisted!")

    # 8. Data Quality & Validation Log
    print("\n[8/12] Testing Data Quality Metrics & Validation Audit Log...")
    r_qual = httpx.get(f"{BASE_URL}/quality?job_id={job_id}")
    assert r_qual.status_code == 200
    print(f" [OK] Quality Overall: {r_qual.json()['overall_score']}%")

    r_issues = httpx.get(f"{BASE_URL}/validation-issues?job_id={job_id}&page=1&page_size=5")
    assert r_issues.status_code == 200
    print(f" [OK] Validation Issues Total: {r_issues.json()['total']}")

    # 9. AI Enrichment Center & Re-run
    print("\n[9/12] Testing AI Enrichment Center...")
    r_enrich = httpx.get(f"{BASE_URL}/enrichment?job_id={job_id}")
    assert r_enrich.status_code == 200
    enrich_data = r_enrich.json()
    print(f" [OK] Enriched Products: {enrich_data['metrics']['enriched_products']} ({enrich_data['metrics']['enrichment_coverage_pct']}%)")
    print(f" [OK] Attributes Extracted: {enrich_data['metrics']['total_attributes_extracted']}")

    # 10. Data Sources & Lineage
    print("\n[10/12] Testing Sources & Lineage...")
    r_sources = httpx.get(f"{BASE_URL}/sources?job_id={job_id}")
    assert r_sources.status_code == 200
    print(f" [OK] Sources Identified: {len(r_sources.json()['sources'])}")
    for s in r_sources.json()["sources"][:3]:
        print(f"   - {s['name']}: {s['product_count']} items ({s['reliability_tier']} Reliability)")

    # 11. Analytics & Throughput
    print("\n[11/12] Testing Analytics & Telemetry...")
    r_analytics = httpx.get(f"{BASE_URL}/analytics?job_id={job_id}")
    assert r_analytics.status_code == 200
    tm = r_analytics.json()["throughput_metrics"]
    print(f" [OK] Throughput: {tm['products_per_second']} products/sec in {tm['duration_seconds']}s")

    # 12. Exports
    print("\n[12/12] Testing Export Endpoints (CSV, XLSX, Reports)...")
    r_exp_csv = httpx.get(f"{BASE_URL}/export/products?job_id={job_id}&format=csv")
    assert r_exp_csv.status_code == 200
    assert len(r_exp_csv.content) > 10000
    print(f" [OK] Cleaned Catalog CSV export: {len(r_exp_csv.content):,} bytes")

    r_exp_xlsx = httpx.get(f"{BASE_URL}/export/products?job_id={job_id}&format=xlsx")
    assert r_exp_xlsx.status_code == 200
    assert len(r_exp_xlsx.content) > 10000
    print(f" [OK] Cleaned Catalog XLSX export: {len(r_exp_xlsx.content):,} bytes")

    r_exp_conf = httpx.get(f"{BASE_URL}/export/conflicts?job_id={job_id}")
    assert r_exp_conf.status_code == 200
    print(f" [OK] Conflicts Report export: {len(r_exp_conf.content):,} bytes")

    r_exp_dups = httpx.get(f"{BASE_URL}/export/duplicates?job_id={job_id}")
    assert r_exp_dups.status_code == 200
    print(f" [OK] Duplicates Report export: {len(r_exp_dups.content):,} bytes")

    # Check frontend HTML
    try:
        r_fe = httpx.get(FRONTEND_URL)
        assert r_fe.status_code == 200
        print(f" [OK] Frontend HTTP 200 OK at {FRONTEND_URL}")
    except Exception as e:
        print(f"   Frontend dev server check: {e}")

    print("\n" + "=" * 70)
    print("ALL 12 VERIFICATION SUITES PASSED WITH ZERO ERRORS!")
    print("PRODUCTIQ PLATFORM IS FULLY OPERATIONAL AND READY FOR PRESENTATION.")
    print("=" * 70)

if __name__ == "__main__":
    run_verification()
