import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.database import get_db, SessionLocal
from backend.database.models import Product, ProcessingJob

client = TestClient(app)

def test_product_detail_lookups():
    db = SessionLocal()
    try:
        # Get or create a sample product
        product = db.query(Product).first()
        if not product:
            job = ProcessingJob(status="completed", progress=100)
            db.add(job)
            db.commit()
            db.refresh(job)
            product = Product(
                job_id=job.id,
                product_id="PID-TEST-001",
                product_name="ABB High Voltage Motor X1",
                model_number="ABB-MTR-X1",
                brand="ABB",
                category="Motors",
                quality_score=94.5,
                ai_confidence=0.96
            )
            db.add(product)
            db.commit()
            db.refresh(product)

        # 1. Query by integer ID
        res_int = client.get(f"/api/products/{product.id}")
        assert res_int.status_code == 200
        data_int = res_int.json()
        assert data_int["id"] == product.id
        assert data_int["product_name"] == product.product_name
        assert "scores" in data_int
        assert "ai_intelligence" in data_int
        assert data_int["scores"]["trust_score"] is not None

        # 2. Query by external string product_id
        if product.product_id:
            res_str = client.get(f"/api/products/{product.product_id}")
            assert res_str.status_code == 200
            data_str = res_str.json()
            assert data_str["id"] == product.id

        # 3. Query non-existent returns 404 cleanly without crashing
        res_404 = client.get("/api/products/NON_EXISTENT_ID_999999")
        assert res_404.status_code == 404
    finally:
        db.close()
