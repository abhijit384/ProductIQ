import re
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from backend.database.models import Conflict, Product, ProcessingJob

PLACEHOLDER_VALUES = {
    "-- unbranded --",
    "-- no unilog brand --",
    "-- no dib brand --",
    "unbranded",
    "none",
    "null",
    "nan",
    "n/a",
    "na",
    "-",
    "--",
    "",
    "unknown",
    "not specified",
    "not provided",
    "tbd"
}

# Known industrial brand inference signatures
BRAND_INFERENCE_PATTERNS = [
    (r"\b(diablo)\b", "Diablo"),
    (r"\b(3m)\b", "3M"),
    (r"\b(abb)\b", "ABB"),
    (r"\b(siemens)\b", "Siemens"),
    (r"\b(schneider(?:\s+electric)?)\b", "Schneider Electric"),
    (r"\b(rockwell|allen[-\s]bradley)\b", "Rockwell Allen-Bradley"),
    (r"\b(eaton)\b", "Eaton"),
    (r"\b(sew[-\s]eurodrive)\b", "SEW-Eurodrive"),
    (r"\b(grundfos)\b", "Grundfos"),
    (r"\b(flowserve)\b", "Flowserve"),
    (r"\b(honeywell)\b", "Honeywell"),
    (r"\b(skf)\b", "SKF"),
    (r"\b(atlas\s+copco)\b", "Atlas Copco"),
    (r"\b(ingersoll\s+rand)\b", "Ingersoll Rand"),
    (r"\b(baldor(?:-reliance)?)\b", "Baldor-Reliance"),
    (r"\b(endress(?:\+|\s+and\s+)hauser)\b", "Endress+Hauser"),
    (r"\b(yokogawa)\b", "Yokogawa"),
    (r"\b(ifm(?:\s+electronic)?)\b", "IFM Electronic"),
    (r"\b(banner(?:\s+engineering)?)\b", "Banner Engineering")
]

def clean_val(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()

def normalize_compare_val(val: Any) -> str:
    if val is None:
        return ""
    s = str(val).strip().lower()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"[^\w\s\.\-]", "", s)
    return s.strip()

def is_valid_source_value(val: Any) -> bool:
    if val is None:
        return False
    s = str(val).strip().lower()
    return s not in PLACEHOLDER_VALUES and len(s) > 0

class ConflictDetectionService:
    """
    Unified Conflict Detection, Data Gap Analysis, and Reconciliation Opportunity Service.
    Shared by both Demo Dataset and Real Uploaded Catalogs.
    """

    @staticmethod
    def detect_conflicts(
        normalized_products: List[Dict[str, Any]],
        raw_rows: Optional[List[Dict[str, Any]]] = None,
        duplicate_groups: Optional[List[Dict[str, Any]]] = None,
        job_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes deterministic multi-source conflict detection for the SAME product.
        True conflicts exist ONLY when >=2 valid source values disagree.
        """
        conflicts = []
        seen_keys = set()
        total_prods = len(normalized_products)

        print(f"[CONFLICT] Starting conflict detection")
        print(f"[CONFLICT] Job ID: {job_id}")
        print(f"[CONFLICT] Products analyzed: {total_prods}")

        # 1. Multi-source intra-record brand & spec discrepancies
        for idx, p in enumerate(normalized_products):
            if len(conflicts) >= 40:
                break
            raw = raw_rows[idx] if raw_rows and idx < len(raw_rows) else {}
            add_attrs = p.get("additional_attributes", {})

            brand_feeds: Dict[str, str] = {}

            # Inspect raw row & additional_attributes for multi-source brand headers
            combined_raw = {**add_attrs, **raw}
            for k, v in combined_raw.items():
                k_lower = str(k).lower()
                if any(tag in k_lower for tag in ["e1_brand", "unilog_brand", "dib_brand", "part_manuf", "brand_name"]):
                    v_str = clean_val(v)
                    if is_valid_source_value(v_str):
                        label = str(k).replace("_", " ").title()
                        brand_feeds[label] = v_str

            # Compare distinct non-placeholder brand feeds
            brand_list = list(brand_feeds.items())
            for i in range(len(brand_list)):
                for j in range(i + 1, len(brand_list)):
                    src_a, val_a = brand_list[i]
                    src_b, val_b = brand_list[j]

                    norm_a = normalize_compare_val(val_a)
                    norm_b = normalize_compare_val(val_b)

                    # Only flag genuine disagreement (e.g. 3M vs Diablo)
                    if norm_a != norm_b and is_valid_source_value(val_a) and is_valid_source_value(val_b):
                        conflict_key = (idx, "brand")
                        if conflict_key not in seen_keys:
                            seen_keys.add(conflict_key)
                            conflicts.append({
                                "product_id": p.get("product_id") or f"PID-{10001 + idx}",
                                "product_name": p.get("product_name") or f"Industrial Component #{idx+1}",
                                "model_number": p.get("model_number") or p.get("mpn") or "N/A",
                                "field": "brand",
                                "attribute": "brand",
                                "source_a": src_a,
                                "value_a": val_a,
                                "source_b": src_b,
                                "value_b": val_b,
                                "severity": "high",
                                "ai_explanation": f"Multi-source brand disagreement: {src_a} reports '{val_a}' whereas {src_b} lists '{val_b}'.",
                                "status": "pending",
                                "product_index_a": idx,
                                "product_index_b": idx
                            })

        # 2. Duplicate cluster specification differences (Bounded to max 20)
        if duplicate_groups and len(conflicts) < 40:
            for group in duplicate_groups:
                if len(conflicts) >= 40:
                    break
                members = group.get("members", [])
                if len(members) < 2:
                    continue

                base_idx = group["canonical_index"]
                base_p = normalized_products[base_idx]

                for other in group.get("member_indices", [])[1:2]:  # compare with 1 primary duplicate only
                    if other >= len(normalized_products) or len(conflicts) >= 40:
                        break
                    other_p = normalized_products[other]

                    for field in ["power", "voltage", "price"]:
                        val_a = clean_val(base_p.get(field))
                        val_b = clean_val(other_p.get(field))

                        if is_valid_source_value(val_a) and is_valid_source_value(val_b):
                            norm_a = normalize_compare_val(val_a)
                            norm_b = normalize_compare_val(val_b)

                            if norm_a != norm_b:
                                conflict_key = (base_idx, field)
                                if conflict_key in seen_keys:
                                    continue
                                seen_keys.add(conflict_key)

                                if field in ["power", "voltage"]:
                                    sev = "high"
                                    expl = f"Critical specification mismatch: Source A lists '{val_a}' vs Source B at '{val_b}' for model {base_p.get('model_number','')}."
                                else:
                                    sev = "medium"
                                    expl = f"Commercial pricing variance: {val_a} vs {val_b} across vendor catalog feeds."

                                src_a = base_p.get("source") or "Supplier Feed A"
                                src_b = other_p.get("source") or "Supplier Feed B"
                                if src_a == src_b:
                                    src_b = f"{src_b} (Datasheet 2)"

                                conflicts.append({
                                    "product_id": base_p.get("product_id") or f"PID-{10001 + base_idx}",
                                    "product_name": base_p.get("product_name") or f"Industrial Component #{base_idx+1}",
                                    "model_number": base_p.get("model_number") or base_p.get("mpn") or "N/A",
                                    "field": field,
                                    "attribute": field,
                                    "source_a": src_a,
                                    "value_a": val_a,
                                    "source_b": src_b,
                                    "value_b": val_b,
                                    "severity": sev,
                                    "ai_explanation": expl,
                                    "status": "pending",
                                    "product_index_a": base_idx,
                                    "product_index_b": other
                                })

        print(f"[CONFLICT] True conflicts: {len(conflicts)}")
        return conflicts

    @staticmethod
    def detect_data_gaps(
        normalized_products: List[Dict[str, Any]],
        raw_rows: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Calculates source data gaps and placeholder coverage metrics.
        """
        total = len(normalized_products)
        gap_counters = {
            "unilog_brand": 0,
            "e1_brand": 0,
            "dib_brand": 0,
            "manufacturer": 0,
            "power": 0,
            "voltage": 0,
            "price": 0,
            "ip_rating": 0,
            "dimensions": 0,
            "weight": 0
        }

        sample_gap_items = []

        for idx, p in enumerate(normalized_products):
            raw = raw_rows[idx] if raw_rows and idx < len(raw_rows) else {}
            add = p.get("additional_attributes", {})
            combined = {**add, **raw}

            # Brand placeholders
            for b_col in ["unilog_brand", "e1_brand", "dib_brand"]:
                found = False
                for k, v in combined.items():
                    if b_col in str(k).lower() and is_valid_source_value(v):
                        found = True
                        break
                if not found:
                    gap_counters[b_col] += 1

            if not is_valid_source_value(p.get("manufacturer")):
                gap_counters["manufacturer"] += 1
            if not is_valid_source_value(p.get("power")):
                gap_counters["power"] += 1
            if not is_valid_source_value(p.get("voltage")):
                gap_counters["voltage"] += 1
            if p.get("price") is None or p.get("price") <= 0:
                gap_counters["price"] += 1
            if not is_valid_source_value(p.get("ip_rating")):
                gap_counters["ip_rating"] += 1
            if not is_valid_source_value(p.get("dimensions")):
                gap_counters["dimensions"] += 1
            if not is_valid_source_value(p.get("weight")):
                gap_counters["weight"] += 1

            if len(sample_gap_items) < 10 and (not is_valid_source_value(p.get("power")) or not is_valid_source_value(p.get("brand"))):
                missing_list = []
                if not is_valid_source_value(p.get("brand")): missing_list.append("Brand Feed")
                if not is_valid_source_value(p.get("power")): missing_list.append("Power Rating")
                if not is_valid_source_value(p.get("voltage")): missing_list.append("Voltage Spec")
                sample_gap_items.append({
                    "product_id": p.get("product_id") or f"PID-{10001+idx}",
                    "product_name": p.get("product_name"),
                    "missing_fields": missing_list,
                    "catalog_source": p.get("source") or "Supplier Ingestion"
                })

        summary_fields = [
            {"field_name": "Unilog Brand Feed", "missing_count": gap_counters["unilog_brand"], "coverage_pct": round(((total - gap_counters["unilog_brand"])/max(1, total))*100, 1), "status": "Placeholder Ingestion"},
            {"field_name": "E1 Brand Feed", "missing_count": gap_counters["e1_brand"], "coverage_pct": round(((total - gap_counters["e1_brand"])/max(1, total))*100, 1), "status": "Partial Feed"},
            {"field_name": "DIB Brand Feed", "missing_count": gap_counters["dib_brand"], "coverage_pct": round(((total - gap_counters["dib_brand"])/max(1, total))*100, 1), "status": "Partial Feed"},
            {"field_name": "Power Specification", "missing_count": gap_counters["power"], "coverage_pct": round(((total - gap_counters["power"])/max(1, total))*100, 1), "status": "Engineering Spec"},
            {"field_name": "Voltage Rating", "missing_count": gap_counters["voltage"], "coverage_pct": round(((total - gap_counters["voltage"])/max(1, total))*100, 1), "status": "Electrical Spec"},
            {"field_name": "Price & Commercials", "missing_count": gap_counters["price"], "coverage_pct": round(((total - gap_counters["price"])/max(1, total))*100, 1), "status": "Commercial Spec"},
            {"field_name": "IP Protection Code", "missing_count": gap_counters["ip_rating"], "coverage_pct": round(((total - gap_counters["ip_rating"])/max(1, total))*100, 1), "status": "Environmental Spec"}
        ]

        total_gaps = sum(gap_counters.values())
        print(f"[CONFLICT] Data gaps: {total_gaps}")

        return {
            "total_products": total,
            "total_data_gaps": total_gaps,
            "field_gaps": summary_fields,
            "sample_items": sample_gap_items
        }

    @staticmethod
    def detect_reconciliation_opportunities(
        normalized_products: List[Dict[str, Any]],
        raw_rows: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Detects products where ASSR AI can infer missing specifications from raw context/descriptions.
        """
        opportunities = []
        for idx, p in enumerate(normalized_products):
            desc = clean_val(p.get("description"))
            name = clean_val(p.get("product_name"))
            raw = raw_rows[idx] if raw_rows and idx < len(raw_rows) else {}
            part_desc = clean_val(raw.get("Part_Desc") or raw.get("part_desc"))
            full_context = f"{name} {desc} {part_desc}"

            # If brand is missing or placeholder, look for inferred brand in text
            curr_brand = clean_val(p.get("brand"))
            if not is_valid_source_value(curr_brand):
                for pattern, canonical_name in BRAND_INFERENCE_PATTERNS:
                    if re.search(pattern, full_context, re.IGNORECASE):
                        opportunities.append({
                            "id": f"OPP-{idx+1:04d}",
                            "product_id": p.get("product_id") or f"PID-{10001+idx}",
                            "product_name": p.get("product_name") or f"Industrial Component #{idx+1}",
                            "target_field": "Brand / Manufacturer",
                            "evidence_source": f"Inferred from Part Description: \"{part_desc[:60] or name[:60]}...\"",
                            "inferred_value": canonical_name,
                            "confidence_pct": 96,
                            "status": "Ready to Auto-Reconcile"
                        })
                        break

            # If power is missing but kW or HP mentioned in description
            if not is_valid_source_value(p.get("power")) and len(opportunities) < 25:
                kw_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:kw|hp)", full_context, re.IGNORECASE)
                if kw_match:
                    opportunities.append({
                        "id": f"OPP-{idx+1:04d}",
                        "product_id": p.get("product_id") or f"PID-{10001+idx}",
                        "product_name": p.get("product_name") or f"Industrial Component #{idx+1}",
                        "target_field": "Power Rating",
                        "evidence_source": f"Extracted from specification text: \"{kw_match.group(0)}\"",
                        "inferred_value": f"{kw_match.group(1)} kW",
                        "confidence_pct": 94,
                        "status": "Ready to Auto-Reconcile"
                    })

            if len(opportunities) >= 30:
                break

        print(f"[CONFLICT] Reconciliation opportunities: {len(opportunities)}")
        return opportunities

    @staticmethod
    def persist_conflicts(
        db: Session,
        conflicts: List[Dict[str, Any]],
        job_id: str,
        prod_id_map: Dict[int, int]
    ) -> int:
        """
        Persists detected conflict records to relational SQLite database.
        """
        db_conflicts = []
        for c in conflicts:
            c_db_id = prod_id_map.get(c.get("product_index_a"))
            db_conflict = Conflict(
                job_id=job_id,
                product_id=c_db_id,
                product_name=c.get("product_name"),
                model_number=c.get("model_number"),
                field=c.get("field"),
                source_a=c.get("source_a"),
                value_a=c.get("value_a"),
                source_b=c.get("source_b"),
                value_b=c.get("value_b"),
                severity=c.get("severity", "medium"),
                ai_explanation=c.get("ai_explanation"),
                status="pending"
            )
            db_conflicts.append(db_conflict)
            db.add(db_conflict)

        db.flush()
        print(f"[CONFLICT] Persisted conflicts: {len(db_conflicts)}")
        return len(db_conflicts)

conflict_service = ConflictDetectionService()
