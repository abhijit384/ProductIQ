import os
import re
import json
import hashlib
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# ==============================================================================
# CANONICAL PRODUCTIQ SCHEMA DEFINITION
# ==============================================================================

CANONICAL_SCHEMA: Dict[str, Dict[str, Any]] = {
    "product_identifier": {
        "label": "Product Identifier",
        "description": "Primary unique SKU, catalog ID, item code, or part identifier",
        "type": "string",
        "aliases": ["product_id", "id", "item_code", "product_code", "item_no", "item_id", "part_no", "part_num", "article_no", "code"]
    },
    "mpn": {
        "label": "Manufacturer Part Number (MPN)",
        "description": "Original manufacturer part or catalog number",
        "type": "string",
        "aliases": ["mfg_part_num", "part_number", "partnumber", "mfr_part_no", "mfg_pn", "mpn", "pn", "part_no", "mfr_part_num"]
    },
    "sku": {
        "label": "SKU",
        "description": "Stock keeping unit or internal inventory code",
        "type": "string",
        "aliases": ["sku", "stock_code", "inventory_id", "sku_number", "item_sku"]
    },
    "product_name": {
        "label": "Product Name / Title",
        "description": "Commercial product name, title, or catalog header",
        "type": "string",
        "aliases": ["product_name", "name", "title", "item_name", "product_title", "headline", "item_title", "part_name"]
    },
    "product_description": {
        "label": "Product Description",
        "description": "Detailed text description, technical narrative, or summary",
        "type": "string",
        "aliases": ["description", "desc", "part_desc", "longdescription", "long_desc", "details", "item_description", "product_desc", "summary"]
    },
    "brand": {
        "label": "Brand Name",
        "description": "Commercial brand label or source brand (e.g. Siemens, ABB, E1 Brand)",
        "type": "string",
        "aliases": ["brand", "brand_name", "brandname", "e1_brand", "unilog_brand", "dib_brand", "trade_brand", "label"]
    },
    "manufacturer": {
        "label": "Manufacturer / Maker",
        "description": "Original equipment manufacturer (OEM), maker, or producer",
        "type": "string",
        "aliases": ["manufacturer", "maker", "part_manuf", "manufacturername", "mfr", "mfg", "oem", "producer"]
    },
    "supplier": {
        "label": "Supplier / Vendor",
        "description": "Distributor, wholesaler, seller, or vendor entity",
        "type": "string",
        "aliases": ["supplier", "vendor", "distributor", "seller", "wholesaler", "source_supplier"]
    },
    "category": {
        "label": "Primary Category",
        "description": "High-level industrial equipment classification or department",
        "type": "string",
        "aliases": ["category", "cat", "product_category", "prod_cat", "department", "division", "segment", "family"]
    },
    "subcategory": {
        "label": "Subcategory",
        "description": "Specific technical equipment subcategory or product type",
        "type": "string",
        "aliases": ["subcategory", "sub_category", "subcat", "type", "sub_type", "class", "group"]
    },
    "model_number": {
        "label": "Model Number",
        "description": "Equipment model series, type code, or chassis designation",
        "type": "string",
        "aliases": ["model_number", "model", "model_no", "model_code", "series", "type_code", "catalog_no"]
    },
    "price": {
        "label": "Price / Unit Cost",
        "description": "Numeric unit price, cost, MSRP, or purchase price",
        "type": "number",
        "aliases": ["price", "unit_price", "cost", "msrp", "list_price", "rate", "amount", "sale_price"]
    },
    "currency": {
        "label": "Currency",
        "description": "ISO currency code or symbol (USD, EUR, GBP, $, €)",
        "type": "string",
        "aliases": ["currency", "curr", "currency_code", "price_unit", "curr_code"]
    },
    "voltage": {
        "label": "Voltage Rating",
        "description": "Operating electrical voltage rating (V, VAC, VDC, kV)",
        "type": "string",
        "aliases": ["voltage", "voltagerating", "volts", "voltage_rating", "rated_voltage", "nominal_voltage", "vac", "vdc"]
    },
    "power": {
        "label": "Power Rating",
        "description": "Rated mechanical/electrical power (kW, HP, W, kVA, MW)",
        "type": "string",
        "aliases": ["power", "powerrating", "wattage", "rated_power", "hp", "kw", "capacity", "power_output"]
    },
    "frequency": {
        "label": "Frequency",
        "description": "AC line electrical frequency (50 Hz, 60 Hz, 50/60 Hz, DC)",
        "type": "string",
        "aliases": ["frequency", "freq", "line_frequency", "hertz", "hz"]
    },
    "rpm": {
        "label": "Rotational Speed (RPM)",
        "description": "Rotational operating speed or motor RPM",
        "type": "string",
        "aliases": ["rpm", "speed", "rotational_speed", "max_rpm", "nominal_rpm"]
    },
    "weight": {
        "label": "Weight / Mass",
        "description": "Product weight or net mass (kg, lbs, grams)",
        "type": "string",
        "aliases": ["weight", "weightkg", "weight_kg", "mass", "net_weight", "gross_weight", "weight_lbs"]
    },
    "dimensions": {
        "label": "Dimensions (LxWxH)",
        "description": "Physical product size or package measurements (mm, cm, in)",
        "type": "string",
        "aliases": ["dimensions", "dim", "size", "measurements", "lxwxh", "package_dimensions"]
    },
    "material": {
        "label": "Housing / Construction Material",
        "description": "Construction material (e.g. Stainless Steel, Cast Iron, Bronze)",
        "type": "string",
        "aliases": ["material", "housing_material", "construction", "body_material", "finish"]
    },
    "ip_rating": {
        "label": "IP Ingress Protection Rating",
        "description": "Enclosure protection rating (IP55, IP65, IP67, IP68, NEMA 4X)",
        "type": "string",
        "aliases": ["ip_rating", "ip_code", "ingress_protection", "protection_rating", "nema_rating", "enclosure_rating"]
    },
    "warranty": {
        "label": "Warranty Period",
        "description": "Manufacturer guarantee or warranty duration (e.g. 24 months, 2 Years)",
        "type": "string",
        "aliases": ["warranty", "warranty_period", "guarantee", "warranty_months", "warranty_years"]
    },
    "country": {
        "label": "Country of Origin",
        "description": "Manufacturing or origin country (COO)",
        "type": "string",
        "aliases": ["country", "country_of_origin", "coo", "origin", "mfg_country", "made_in"]
    },
    "product_url": {
        "label": "Product URL / Link",
        "description": "Direct webpage link or ecommerce catalog URL",
        "type": "string",
        "aliases": ["product_url", "url", "link", "web_url", "item_url", "page_url", "website"]
    },
    "technical_document": {
        "label": "Technical Document / Datasheet",
        "description": "PDF link, specification sheet, or CAD drawing URL",
        "type": "string",
        "aliases": ["technical_document", "datasheet", "spec_sheet", "pdf_url", "doc_url", "manual_url", "drawing"]
    },
    "source": {
        "label": "Catalog Data Source",
        "description": "Originating supplier catalog, ERP feed, or file source",
        "type": "string",
        "aliases": ["source", "data_source", "feed", "catalog_source", "origin_system"]
    },
    "additional_attributes": {
        "label": "Additional / Unmapped Attributes",
        "description": "Extensible key-value store for unmapped, domain-specific, or custom attributes",
        "type": "object",
        "aliases": ["attributes", "extra", "custom_fields", "additional_attributes", "specs"]
    }
}

# ==============================================================================
# PYDANTIC RESPONSE MODELS FOR STRUCTURED AI OUTPUT
# ==============================================================================

class AlternativeMappingItem(BaseModel):
    canonical_field: str = Field(description="Alternative canonical field key")
    confidence: float = Field(default=0.70, description="Confidence score")

class ColumnMappingItem(BaseModel):
    original_column: str = Field(description="Exact original column header name from the uploaded dataset")
    canonical_field: str = Field(description="Matched canonical field key from the ProductIQ schema")
    semantic_meaning: str = Field(description="Concise description of the semantic purpose of this column")
    data_type: str = Field(description="Inferred data type: string, number, boolean, url, or json")
    confidence: float = Field(description="Confidence score between 0.00 and 1.00")
    evidence: str = Field(description="Reasoning based on column name and representative sample values")
    alternatives: List[AlternativeMappingItem] = Field(default_factory=list, description="Alternative possible canonical fields with lower confidence")

class AISchemaAnalysisResponse(BaseModel):
    dataset_summary: str = Field(description="Overview of the dataset domain, purpose, and detected structure")
    columns: List[ColumnMappingItem]

# ==============================================================================
# SCHEMA ANALYZER SERVICE
# ==============================================================================

class SchemaAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
        self.client = None
        self.cache: Dict[str, Dict[str, Any]] = {}
        self._init_client()

    def _init_client(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key, http_options={"timeout": 12000})
            except Exception as e:
                print(f"[SchemaAnalyzer] Error initializing Google GenAI client: {e}")
                self.client = None
        else:
            self.client = None

    def compute_fingerprint(self, headers: List[str], sample_rows: List[Dict[str, Any]]) -> str:
        """Creates a deterministic fingerprint based on column headers and sample data signatures."""
        clean_headers = sorted([str(h).strip().lower() for h in headers if h])
        sample_snippets = []
        for r in sample_rows[:5]:
            vals = [str(r.get(h, "")).strip()[:20] for h in clean_headers]
            sample_snippets.append("|".join(vals))
        signature_raw = f"{'::'.join(clean_headers)}___{'###'.join(sample_snippets)}"
        return hashlib.sha256(signature_raw.encode("utf-8")).hexdigest()

    def extract_column_profiles(self, headers: List[str], rows: List[Dict[str, Any]], sample_size: int = 15) -> Dict[str, Dict[str, Any]]:
        """Extracts 5-20 non-empty representative samples and infers preliminary data types."""
        profiles = {}
        for h in headers:
            if not h:
                continue
            h_str = str(h).strip()
            values = []
            for r in rows:
                val = r.get(h)
                if val is not None:
                    s_val = str(val).strip()
                    if s_val and s_val.lower() not in ("nan", "none", "null", "n/a", "na", "-"):
                        if s_val not in values:
                            values.append(s_val)
                            if len(values) >= sample_size:
                                break
                                
            # Infer preliminary data type
            inferred_type = "string"
            if values:
                numeric_count = sum(1 for v in values if re.match(r"^[-+]?[\d\.,]+(?:\s*[a-zA-Z%]+)?$", v.strip()))
                url_count = sum(1 for v in values if v.startswith("http://") or v.startswith("https://") or "www." in v)
                if url_count / len(values) >= 0.5:
                    inferred_type = "url"
                elif numeric_count / len(values) >= 0.8:
                    inferred_type = "number"
                    
            profiles[h_str] = {
                "samples": values,
                "inferred_type": inferred_type,
                "sample_count": len(values)
            }
        return profiles

    def local_heuristic_match(self, col: str, samples: List[str], inferred_type: str) -> Tuple[str, float, str, List[Dict[str, Any]]]:
        """Performs robust local heuristic analysis using normalized tokens, aliases, and sample patterns."""
        norm_col = re.sub(r"[_\-\s]+", "_", col.lower().strip())
        
        # 1. Exact or alias match
        best_field = "additional_attributes"
        best_conf = 0.50
        evidence = "General catalog attribute"
        alternatives = []
        
        # Check alias dictionary
        for canon_key, spec in CANONICAL_SCHEMA.items():
            if norm_col == canon_key:
                return canon_key, 0.99, f"Header exactly matches standard canonical field '{canon_key}'", []
            for alias in spec.get("aliases", []):
                if norm_col == alias:
                    return canon_key, 0.98, f"Header matches standard alias for '{canon_key}'", []
                if f"_{alias}" in norm_col or f"{alias}_" in norm_col or alias in norm_col:
                    score = 0.88 if len(alias) >= 4 else 0.78
                    if score > best_conf:
                        best_field = canon_key
                        best_conf = score
                        evidence = f"Header contains keyword alias '{alias}'"

        # If already matched strongly to description, title, brand, or ID, keep it unless contradictory
        is_text_description = best_field in ("product_description", "product_name") and best_conf >= 0.85
        
        # 2. Inspect sample values to validate or refine
        if samples and not is_text_description:
            # Check for Price
            if any("$" in s or "€" in s or "£" in s for s in samples):
                if best_field != "price":
                    alternatives.append({"canonical_field": best_field, "confidence": best_conf})
                return "price", 0.95, "Sample values contain currency symbols and numeric values", alternatives
                
            # Check for URL
            if any(s.startswith("http://") or s.startswith("https://") for s in samples):
                if "doc" in norm_col or "pdf" in norm_col or "spec" in norm_col or any(".pdf" in s for s in samples):
                    return "technical_document", 0.96, "Sample values are PDF / technical documentation URLs", alternatives
                return "product_url", 0.95, "Sample values are web product URLs", alternatives

            # Check if samples are short spec strings (e.g. "400 V", "15 kW") rather than full descriptive sentences
            is_short_spec = all(len(s.strip()) < 30 for s in samples[:5])

            # Check for Voltage (e.g. 400 V, 24VDC, 230 V AC)
            if is_short_spec and any(re.search(r"^\d+[\d\.\-]*\s*(?:v|vac|vdc|kv)\b", s.strip(), re.IGNORECASE) for s in samples):
                return "voltage", 0.96, "Sample values contain standardized voltage units (V/VAC/VDC)", alternatives

            # Check for Power (e.g. 15 kW, 20 HP, 15000 W)
            if is_short_spec and any(re.search(r"^\d+[\d\.]*\s*(?:kw|hp|kva|mw|watts?|w)\b", s.strip(), re.IGNORECASE) for s in samples):
                return "power", 0.96, "Sample values contain standardized power units (kW/HP/W/kVA)", alternatives

            # Check for Weight (e.g. 12.5 kg, 22 lbs)
            if is_short_spec and any(re.search(r"^\d+[\d\.]*\s*(?:kg|lbs|pounds|grams?|g)\b", s.strip(), re.IGNORECASE) for s in samples):
                return "weight", 0.96, "Sample values contain standardized weight/mass units (kg/lbs)", alternatives

            # Check for IP Rating (e.g. IP55, IP68)
            if is_short_spec and any(re.search(r"^ip[0-9]{2}[a-z]?$", s.strip(), re.IGNORECASE) for s in samples):
                return "ip_rating", 0.97, "Sample values contain standardized Ingress Protection (IP) ratings", alternatives

            # Check for Brand / Manufacturer vs purely numeric
            is_purely_numeric = all(re.match(r"^[-+]?[\d\.]+$", s) for s in samples[:5])
            if is_purely_numeric and best_field in ("brand", "manufacturer", "product_name", "product_description"):
                alternatives.append({"canonical_field": best_field, "confidence": 0.40})
                return "additional_attributes", 0.60, f"Sample values are numeric ({samples[0]}), contradicting text field interpretation", alternatives

        # Fallback ranking
        if best_conf < 0.70:
            best_field = "additional_attributes"
            best_conf = 0.65
            evidence = "Extensible product parameter preserved in additional attributes"

        return best_field, best_conf, evidence, alternatives

    def _cross_check_and_validate(self, col: str, proposed_field: str, confidence: float, evidence: str, samples: List[str]) -> Tuple[str, float, str]:
        """
        Cross-checks AI interpretation against sample values to eliminate semantic hallucinations.
        """
        if not samples:
            return proposed_field, confidence, evidence

        # Purely numeric samples check
        is_numeric = all(re.match(r"^[-+]?[\d\.]+$", s.strip()) for s in samples[:5])
        
        if is_numeric and proposed_field in ("brand", "manufacturer", "product_name", "product_description", "supplier", "country"):
            return "additional_attributes", 0.65, f"AI suggested '{proposed_field}' but sample values are purely numeric ({', '.join(samples[:3])}). Classified as additional attribute."
            
        # If proposed field is product_description or product_name and samples are descriptive texts (>25 chars), keep it!
        if proposed_field in ("product_description", "product_name"):
            return proposed_field, confidence, evidence

        is_short_spec = all(len(s.strip()) < 30 for s in samples[:5])
        if is_short_spec:
            has_voltage_unit = any(re.search(r"^\d+[\d\.\-]*\s*(?:v|vac|vdc|kv)\b", s.strip(), re.IGNORECASE) for s in samples)
            if has_voltage_unit and proposed_field != "voltage":
                return "voltage", 0.95, "Sample values exhibit voltage electrical specifications (V/VAC/VDC)."
                
            has_power_unit = any(re.search(r"^\d+[\d\.]*\s*(?:kw|hp|kva|mw|w)\b", s.strip(), re.IGNORECASE) for s in samples)
            if has_power_unit and proposed_field != "power":
                return "power", 0.95, "Sample values exhibit power specifications (kW/HP/W)."

            has_weight_unit = any(re.search(r"^\d+[\d\.]*\s*(?:kg|lbs|g)\b", s.strip(), re.IGNORECASE) for s in samples)
            if has_weight_unit and proposed_field != "weight":
                return "weight", 0.95, "Sample values exhibit weight units (kg/lbs)."

        # Ensure confidence fits thresholds
        return proposed_field, min(1.0, max(0.0, confidence)), evidence

    async def analyze_schema(
        self,
        headers: List[str],
        sample_rows: List[Dict[str, Any]],
        total_rows: int,
        dataset_name: str = "Uploaded Dataset"
    ) -> Dict[str, Any]:
        """
        Main entry point for AI Schema Detection.
        1. Profiles columns and extracts samples
        2. Checks fingerprint cache
        3. Computes local heuristics
        4. Calls Gemini AI for semantic schema intelligence
        5. Cross-checks results against actual sample values
        6. Formats structured result
        """
        fingerprint = self.compute_fingerprint(headers, sample_rows)
        if fingerprint in self.cache:
            cached_result = dict(self.cache[fingerprint])
            cached_result["cached"] = True
            return cached_result

        # Step 1: Extract column profiles
        profiles = self.extract_column_profiles(headers, sample_rows)

        # Step 2: Compute local baseline heuristics
        heuristic_mappings = {}
        for h, prof in profiles.items():
            field, conf, ev, alts = self.local_heuristic_match(h, prof["samples"], prof["inferred_type"])
            heuristic_mappings[h] = {
                "canonical_field": field,
                "confidence": conf,
                "evidence": ev,
                "alternatives": alts
            }

        # Step 3: Run Gemini AI Schema Analysis if available
        ai_response_data = None
        if self.client and self.api_key:
            prompt_payload = {
                "dataset_name": dataset_name,
                "total_rows": total_rows,
                "canonical_fields_available": {
                    k: {"label": v["label"], "description": v["description"]}
                    for k, v in CANONICAL_SCHEMA.items()
                },
                "dataset_columns_to_map": [
                    {
                        "original_column": h,
                        "inferred_data_type": prof["inferred_type"],
                        "representative_sample_values": prof["samples"][:10]
                    }
                    for h, prof in profiles.items()
                ]
            }

            system_instruction = (
                "You are ProductIQ's AI Schema Analyzer for industrial B2B commerce catalogs.\n"
                "Analyze the uploaded dataset columns and map each column to the most accurate canonical ProductIQ schema field.\n"
                "CRITICAL RULES:\n"
                "1. Inspect BOTH the column header name AND the representative sample values.\n"
                "2. If a column contains part numbers, OEM codes, or SKUs (e.g. 'Mfg_Part_Num', 'ProductCode'), map to 'mpn', 'sku', or 'product_identifier'.\n"
                "3. If a column contains descriptions or specs (e.g. 'Part_Desc', 'LongDescription'), map to 'product_description' or 'product_name'.\n"
                "4. If multiple brand columns exist (e.g. 'E1_Brand', 'Unilog_Brand', 'BrandName'), map to 'brand'.\n"
                "5. If a column indicates manufacturer/maker (e.g. 'Part_Manuf', 'ManufacturerName', 'Maker'), map to 'manufacturer'.\n"
                "6. If a column is unmapped or domain-specific, map to 'additional_attributes'.\n"
                "7. Output valid JSON matching the AISchemaAnalysisResponse schema."
            )

            try:
                def _call_schema_ai():
                    return self.client.models.generate_content(
                        model=self.model_name,
                        contents=f"{system_instruction}\n\nDataset Payload:\n{json.dumps(prompt_payload, indent=2)}",
                        config={
                            "response_mime_type": "application/json",
                            "response_schema": AISchemaAnalysisResponse,
                            "temperature": 0.1
                        }
                    )

                response = await asyncio.wait_for(
                    asyncio.to_thread(_call_schema_ai),
                    timeout=8.0
                )
                if response and response.text:
                    ai_response_data = json.loads(response.text)
            except Exception as e:
                print(f"[SchemaAnalyzer] Gemini API schema analysis failed (falling back to local heuristics): {e}")
                ai_response_data = None

        # Step 4: Merge AI response with local heuristic cross-checking
        column_results = []
        recognized_count = 0
        review_required_count = 0

        # Build lookup from AI response if available
        ai_col_map = {}
        if ai_response_data and "columns" in ai_response_data:
            for item in ai_response_data["columns"]:
                ai_col_map[item.get("original_column")] = item

        for h in headers:
            if not h or h not in profiles:
                continue
            prof = profiles[h]
            h_samples = prof["samples"]
            h_type = prof["inferred_type"]
            local_meta = heuristic_mappings.get(h, {})

            if h in ai_col_map:
                ai_item = ai_col_map[h]
                prop_field = ai_item.get("canonical_field") or local_meta.get("canonical_field", "additional_attributes")
                if prop_field not in CANONICAL_SCHEMA:
                    prop_field = local_meta.get("canonical_field", "additional_attributes")
                raw_conf = float(ai_item.get("confidence", 0.95))
                raw_ev = ai_item.get("evidence") or local_meta.get("evidence", "Identified by AI semantic analysis")
                sem_mean = ai_item.get("semantic_meaning") or CANONICAL_SCHEMA.get(prop_field, {}).get("label", prop_field)
                alts = ai_item.get("alternatives") or local_meta.get("alternatives", [])
            else:
                prop_field = local_meta.get("canonical_field", "additional_attributes")
                raw_conf = local_meta.get("confidence", 0.85)
                raw_ev = local_meta.get("evidence", "Identified by local heuristic pattern analysis")
                sem_mean = CANONICAL_SCHEMA.get(prop_field, {}).get("label", prop_field)
                alts = local_meta.get("alternatives", [])

            # Cross-check against actual sample values
            final_field, final_conf, final_ev = self._cross_check_and_validate(h, prop_field, raw_conf, raw_ev, h_samples)

            # Confidence Level Category
            if final_conf >= 0.90:
                conf_level = "high"
                recognized_count += 1
            elif final_conf >= 0.75:
                conf_level = "medium"
                recognized_count += 1
            else:
                conf_level = "low"
                review_required_count += 1

            # Prepare alternatives list
            alt_list = []
            for a in alts:
                c_f = a.get("canonical_field")
                if c_f and c_f != final_field and c_f in CANONICAL_SCHEMA:
                    alt_list.append({
                        "canonical_field": c_f,
                        "label": CANONICAL_SCHEMA[c_f]["label"],
                        "confidence": round(float(a.get("confidence", 0.70)), 2)
                    })
            if not alt_list and final_field != "additional_attributes":
                alt_list.append({
                    "canonical_field": "additional_attributes",
                    "label": "Additional / Unmapped Attribute",
                    "confidence": 0.50
                })

            column_results.append({
                "original_column": h,
                "canonical_field": final_field,
                "canonical_label": CANONICAL_SCHEMA.get(final_field, {}).get("label", final_field),
                "semantic_meaning": sem_mean,
                "data_type": h_type,
                "confidence": round(final_conf, 2),
                "confidence_level": conf_level,
                "evidence": final_ev,
                "sample_values": h_samples[:6],
                "alternatives": alt_list
            })

        summary_text = (
            ai_response_data.get("dataset_summary")
            if ai_response_data and "dataset_summary" in ai_response_data
            else f"ProductIQ analyzed {len(headers)} columns across {total_rows} industrial catalog records."
        )

        final_analysis = {
            "fingerprint": fingerprint,
            "dataset_name": dataset_name,
            "total_rows": total_rows,
            "total_columns": len(headers),
            "recognized_count": recognized_count,
            "review_required_count": review_required_count,
            "dataset_summary": summary_text,
            "canonical_fields": [
                {"key": k, "label": v["label"], "description": v["description"], "type": v["type"]}
                for k, v in CANONICAL_SCHEMA.items()
            ],
            "columns": column_results,
            "cached": False
        }

        # Cache result
        self.cache[fingerprint] = final_analysis
        return final_analysis

# Singleton instance
schema_analyzer = SchemaAnalyzer()
