# PRODUCTIQ — Full-Stack AI Product Intelligence Platform

> **"Turn messy product data into trusted product intelligence."**

**ProductIQ** is an enterprise-grade AI product intelligence platform designed to ingest, clean, normalize, deduplicate, validate, enrich, and export large, messy industrial product catalogs (1,000+ to 100,000+ rows) across CSV and XLSX formats.

---

## Why ProductIQ?

ProductIQ transforms sparse industrial product data into trusted, structured, commerce-ready intelligence.

**Input**  
Sparse product catalog

**Processing**  
Schema Detection → Normalization → Deduplication → Validation → Gemini AI Enrichment

**Output**  
Structured product intelligence + quality insights + export-ready catalog

---

## 1. Key Features & Capabilities

- **High-Throughput File Ingestion**: Instant parsing and schema autodetection for CSV (with dialect detection) and XLSX formats.
- **Deterministic Specification Normalization**: Standardizes power (`kW`, `W`, `MW`, `HP`), voltage (`V`, `kV`, `VAC`, `VDC`), speed (`RPM`), frequency (`Hz`), weights (`kg`, `lbs`, `g`), dimensions, IP ratings (`IP55`, `IP68`), and manufacturer brand canonicalization without unnecessary API costs.
- **High-Speed Fuzzy Deduplication**: RapidFuzz token matching and n-gram clustering to identify duplicate products, calculate similarity percentages, and group duplicates with interactive merge/ignore actions.
- **Rule-Based Constraint Validation**: Validates mandatory fields, numeric ranges, URL structures, IP rating regex compliance, and categorizes violations by severity (High, Medium, Low).
- **Gemini GenAI Structured Intelligence**: Official `google-genai` SDK integration with Pydantic JSON schemas, batching, local SHA-256 caching, concurrency rate-limiting, and offline fallback safeguards.
- **Multi-Source Conflict Detection & Resolution**: Detects spec contradictions across OEM datasheets, distributor catalogs, and ERP master data with interactive resolution (Accept Source A, Accept Source B, Keep for Review).
- **Multi-Dimensional Quality Scoring**: Mathematical scoring model evaluating Completeness, Validity, Consistency, and Source Agreement (0-100 scale).
- **Real-Time Progress Streaming**: Server-Sent Events (SSE) provide live progress and stage checklists directly to the frontend.
- **Commerce-Ready Exports**: Instant downloads for Cleaned Catalog (CSV/XLSX), Validation Audit (CSV), Conflicts Report (CSV), and Duplicate Clusters (CSV).

---

## 2. Architecture Overview

```
                          ┌─────────────────────────────┐
                          │   Messy Industrial Catalog   │
                          │     (CSV / XLSX 1,000+ Rows)│
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │  Upload & Schema Detection  │
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │ Deterministic Normalization │
                          │ (kW, HP, V, kg, IP, Brands) │
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │  High-Speed Deduplication   │
                          │   (RapidFuzz Clustering)    │
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │    Rule-Based Validation    │
                          │  (Constraints & Severities) │
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │     Gemini AI Enrichment    │
                          │ (SDK + Cache + Batch JSON)  │
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │   Multi-Source Conflicts    │
                          │    & Data Quality Score     │
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │  SQLite Database + SSE Bus  │
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │    Enterprise React UI      │
                          └─────────────────────────────┘
```

---

## 3. Technology Stack

### Backend
- **Python 3.10+ / 3.14**
- **FastAPI**: Asynchronous REST API and Server-Sent Events (SSE).
- **SQLAlchemy 2.0 & SQLite**: Relational database with indexed search.
- **Pydantic v2**: Structured schema validation.
- **Pandas & OpenPyXL**: High-performance CSV and Excel data manipulation.
- **RapidFuzz**: C-accelerated fuzzy string matching and clustering.
- **Google GenAI SDK (`google-genai`)**: Official Gemini API integration.

### Frontend
- **React 18 & Vite**: Lightning-fast enterprise SPA.
- **Tailwind CSS**: Custom dark-mode enterprise design system with glassmorphism and luminous indicators.
- **Lucide React**: Comprehensive icon library.
- **Recharts**: Responsive data quality, funnel, and distribution charts.

---

## 4. Quick Start & Setup

### Prerequisites
- Python 3.10+ installed
- Node.js v18+ and npm installed

### 1. Backend Setup
```bash
# Navigate to project root
cd d:/ProductIQ

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate   # Windows
# source .venv/bin/activate # macOS/Linux

# Install backend dependencies
pip install -r backend/requirements.txt

# Configure .env
cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY (optional, fallback engine active if omitted)

# Start FastAPI backend server
python -m uvicorn backend.main:app --reload --port 8000
```
Backend will be live at: `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

### 2. Frontend Setup
```bash
# Open a new terminal in frontend directory
cd d:/ProductIQ/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be live at: `http://localhost:5173`.

---

## 5. Environment Variables

Create `.env` in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash
DATABASE_URL=sqlite:///./productiq.db
PORT=8000
HOST=0.0.0.0
```

> [!IMPORTANT]
> - `GEMINI_API_KEY` is loaded **ONLY** on the backend and is never exposed to the frontend.
> - If `GEMINI_API_KEY` is not provided or reaches rate limits, ProductIQ's **Offline Fallback Guard** automatically executes deterministic intelligence so the application remains 100% operational.

---

## 6. Testing

Run the automated test suite verifying unit normalization, duplicate detection, validation rules, quality scoring, and end-to-end pipeline execution:

```bash
.\.venv\Scripts\python -m pytest backend/tests/ -v
```

---

## 7. Hackathon Live Demo Walkthrough

1. **Open Frontend**: Navigate to `http://localhost:5173`.
2. **Load Demo Dataset**: Upload the supplied sample CSV or use the demo dataset included in the repository.
3. **Watch Real-Time Pipeline**: Observe live Server-Sent Events (SSE) tracking Upload $\rightarrow$ Parsing $\rightarrow$ Normalization $\rightarrow$ Deduplication $\rightarrow$ Validation $\rightarrow$ AI Enrichment $\rightarrow$ Database Commit.
4. **Explore Overview Dashboard**: Review calculated KPIs (Products Processed, Quality Score, Missing Attributes, Conflicts, Duplicates, AI Confidence) and charts.
5. **Inspect Product Intelligence**: Filter by category, sort by quality score, search model numbers, and click any row to open the detailed intelligence view.
6. **Resolve Conflicts**: Navigate to **Conflicts**, review contradictory specs (e.g. 5.5 kW vs 7.5 kW) and click **"Accept Source A"** or **"Accept Source B"** to see live resolution updates.
7. **Merge Duplicates**: Navigate to **Duplicates**, inspect fuzzy similarity percentages, and click **"Merge Cluster"**.
8. **AI Control Center**: Navigate to **AI Enrichment** to view Gemini model stats, cache efficiency, and re-run batch enrichments.
9. **Export Clean Data**: Click **Export** in the topbar and download the Cleaned Catalog (CSV/XLSX) or Diagnostic Reports.

---

## 8. License

MIT License

ProductIQ is an enterprise-grade hackathon prototype built with Google Gemini and FastAPI.