from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON, Index
)
from sqlalchemy.orm import relationship
from backend.database.database import Base

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(64), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    total_rows = Column(Integer, default=0)
    processed_rows = Column(Integer, default=0)
    current_stage = Column(String(64), default="pending")  # upload, parsing, normalization, deduplication, validation, ai_enrichment, conflict_detection, quality_scoring, completed, failed
    status = Column(String(32), default="running")  # running, completed, failed, partially_completed
    progress_percentage = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    
    # Statistical summaries
    stats = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    products = relationship("Product", back_populates="job", cascade="all, delete-orphan")
    validation_issues = relationship("ValidationIssue", back_populates="job", cascade="all, delete-orphan")
    duplicate_groups = relationship("DuplicateGroup", back_populates="job", cascade="all, delete-orphan")
    conflicts = relationship("Conflict", back_populates="job", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(64), ForeignKey("processing_jobs.id"), index=True, nullable=False)
    product_id = Column(String(128), index=True, nullable=False)
    
    # Original raw data snapshot
    raw_data = Column(JSON, default=dict)
    
    # Normalized / Structured core attributes
    product_name = Column(String(512), index=True)
    brand = Column(String(255), index=True)
    category = Column(String(255), index=True)
    subcategory = Column(String(255), index=True)
    model_number = Column(String(255), index=True)
    description = Column(Text)
    price = Column(Float, nullable=True)
    currency = Column(String(16), default="USD")
    
    # Normalized Technical Specifications
    voltage = Column(String(64))
    power = Column(String(64))
    frequency = Column(String(64))
    rpm = Column(String(64))
    weight = Column(String(64))
    dimensions = Column(String(128))
    material = Column(String(128))
    ip_rating = Column(String(64))
    warranty = Column(String(128))
    
    # Meta / Lineage
    manufacturer = Column(String(255))
    country = Column(String(128))
    supplier = Column(String(255), index=True)
    source = Column(String(255), index=True)
    technical_document = Column(String(512))
    product_url = Column(String(512))
    
    # Quality & Intelligence Scores
    quality_score = Column(Float, default=0.0)
    completeness_score = Column(Float, default=0.0)
    validity_score = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.0)
    source_agreement_score = Column(Float, default=1.0)
    
    # AI Enrichment & Validation flags
    ai_enriched = Column(Boolean, default=False)
    ai_confidence = Column(Float, default=0.0)
    validation_status = Column(String(32), default="valid")  # valid, warning, invalid
    
    # Enriched payload
    enriched_data = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("ProcessingJob", back_populates="products")
    attributes = relationship("ProductAttribute", back_populates="product", cascade="all, delete-orphan")
    validation_issues = relationship("ValidationIssue", back_populates="product", cascade="all, delete-orphan")
    ai_result = relationship("AIResult", back_populates="product", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_product_brand_cat", "brand", "category"),
        Index("idx_product_model_pname", "model_number", "product_name"),
    )

class ProductAttribute(Base):
    __tablename__ = "product_attributes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True, nullable=False)
    attribute_name = Column(String(128), index=True, nullable=False)
    raw_value = Column(Text)
    normalized_value = Column(Text)
    unit = Column(String(32), nullable=True)
    source = Column(String(255))
    confidence = Column(Float, default=1.0)
    
    product = relationship("Product", back_populates="attributes")

class ValidationIssue(Base):
    __tablename__ = "validation_issues"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(64), ForeignKey("processing_jobs.id"), index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), index=True, nullable=True)
    product_external_id = Column(String(128), index=True, nullable=True)
    field = Column(String(128), nullable=False)
    issue_type = Column(String(64), nullable=False)  # missing_value, invalid_format, unit_mismatch, out_of_range, invalid_url, conflicting_value
    severity = Column(String(16), default="medium")  # high, medium, low
    message = Column(Text, nullable=False)
    raw_value = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("ProcessingJob", back_populates="validation_issues")
    product = relationship("Product", back_populates="validation_issues")

class DuplicateGroup(Base):
    __tablename__ = "duplicate_groups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(64), ForeignKey("processing_jobs.id"), index=True, nullable=False)
    group_code = Column(String(64), index=True)
    canonical_product_id = Column(Integer, nullable=True)
    canonical_name = Column(String(512))
    similarity_score = Column(Float, default=0.0)
    status = Column(String(32), default="pending")  # pending, merged, ignored, reviewed
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("ProcessingJob", back_populates="duplicate_groups")
    items = relationship("DuplicateItem", back_populates="group", cascade="all, delete-orphan")

class DuplicateItem(Base):
    __tablename__ = "duplicate_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("duplicate_groups.id"), index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), index=True, nullable=False)
    product_external_id = Column(String(128))
    product_name = Column(String(512))
    brand = Column(String(255))
    model_number = Column(String(255))
    similarity_score = Column(Float, default=0.0)
    specs_summary = Column(Text, nullable=True)

    group = relationship("DuplicateGroup", back_populates="items")
    product = relationship("Product")

class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(64), ForeignKey("processing_jobs.id"), index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), index=True, nullable=True)
    product_name = Column(String(512))
    model_number = Column(String(255), index=True)
    field = Column(String(128), index=True, nullable=False)
    source_a = Column(String(255), nullable=False)
    value_a = Column(Text, nullable=False)
    source_b = Column(String(255), nullable=False)
    value_b = Column(Text, nullable=False)
    severity = Column(String(16), index=True, default="high")  # high, medium, low
    ai_explanation = Column(Text, nullable=True)
    status = Column(String(32), index=True, default="pending")  # pending, accepted_a, accepted_b, keep_for_review
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("ProcessingJob", back_populates="conflicts")
    product = relationship("Product")

class AIResult(Base):
    __tablename__ = "ai_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True, nullable=False)
    model_name = Column(String(64))
    raw_response = Column(JSON, default=dict)
    
    predicted_category = Column(String(255))
    predicted_subcategory = Column(String(255))
    predicted_brand = Column(String(255))
    extracted_attributes = Column(JSON, default=dict)
    missing_attributes = Column(JSON, default=list)
    normalized_description = Column(Text)
    commerce_keywords = Column(JSON, default=list)
    confidence_score = Column(Float, default=0.0)
    explanation = Column(Text)
    processing_time_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="ai_result")

class AICache(Base):
    __tablename__ = "ai_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cache_key = Column(String(64), unique=True, index=True, nullable=False)
    model_name = Column(String(64), nullable=False)
    response_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
