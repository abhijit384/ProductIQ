import urllib.request
import json
import time

BASE = 'http://127.0.0.1:8000/api'

def test_full_pipeline():
    # 1. Health
    r = urllib.request.urlopen(f'{BASE}/health')
    assert r.status == 200, 'Health failed'

    # 2. AI Status
    r = urllib.request.urlopen(f'{BASE}/ai/status')
    ai_status = json.loads(r.read().decode())
    assert ai_status['model'] == 'gemini-3.6-flash'

    # 3. Sample CSV
    r = urllib.request.urlopen(f'{BASE}/sample')
    assert r.status == 200
    csv_data = r.read()
    assert len(csv_data) > 100000

    # 4. Trigger Demo Dataset processing
    req = urllib.request.Request(f'{BASE}/demo-dataset', data=b'', method='POST')
    r = urllib.request.urlopen(req)
    job_info = json.loads(r.read().decode())
    job_id = job_info['job_id']

    # 5. Wait for pipeline completion
    for _ in range(60):
        time.sleep(1)
        r = urllib.request.urlopen(f'{BASE}/jobs/{job_id}')
        j = json.loads(r.read().decode())
        if j['status'] == 'completed':
            break
        elif j['status'] == 'failed':
            raise Exception(f'Pipeline failed: {j}')

    # 6. Check Dashboard metrics & Diagnostic Issues by Field
    r = urllib.request.urlopen(f'{BASE}/dashboard?job_id={job_id}')
    dash = json.loads(r.read().decode())
    assert dash['has_data'] is True
    assert len(dash['charts']['issues_by_field']) > 0

    # 7. Check Products table
    r = urllib.request.urlopen(f'{BASE}/products?job_id={job_id}&page=1&page_size=10')
    prods = json.loads(r.read().decode())
    assert prods['total'] == 1050

if __name__ == '__main__':
    test_full_pipeline()
    print('Full verification test passed.')
