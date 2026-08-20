from typing import List, Dict, Any

CORE_FIELDS = [
    "product_id", "product_name", "brand", "category", "subcategory",
    "model_number", "description", "price", "voltage", "power",
    "weight", "dimensions", "ip_rating", "supplier", "product_url"
]

def score_product(
    product: Dict[str, Any],
    validation_issues: List[Dict[str, Any]],
    has_conflict: bool = False
) -> Dict[str, float]:
    """
    Computes multidimensional data quality scores for an individual product.
    Returns:
      - completeness_score (0.0 - 1.0)
      - validity_score (0.0 - 1.0)
      - consistency_score (0.0 - 1.0)
      - source_agreement_score (0.0 - 1.0)
      - quality_score (0.0 - 100.0)
    """
    # 1. Completeness
    filled_count = sum(1 for f in CORE_FIELDS if product.get(f))
    completeness = round(filled_count / len(CORE_FIELDS), 3)

    # 2. Validity
    penalty = 0.0
    for issue in validation_issues:
        sev = issue.get("severity", "medium")
        if sev == "high":
            penalty += 0.35
        elif sev == "medium":
            penalty += 0.15
        elif sev == "low":
            penalty += 0.05
    validity = max(0.0, round(1.0 - penalty, 3))

    # 3. Consistency (Unit adherence, normalized fields)
    consistency_points = 1.0
    power_str = str(product.get("power", ""))
    if power_str and not ("kW" in power_str or "W" in power_str or "kVA" in power_str):
        consistency_points -= 0.2
    voltage_str = str(product.get("voltage", ""))
    if voltage_str and not ("V" in voltage_str):
        consistency_points -= 0.2
    if not product.get("brand"):
        consistency_points -= 0.2
    consistency = max(0.0, round(consistency_points, 3))

    # 4. Source Agreement
    source_agreement = 0.6 if has_conflict else 1.0

    # Composite Quality Score (0 - 100)
    composite = (
        (completeness * 0.35) +
        (validity * 0.35) +
        (consistency * 0.20) +
        (source_agreement * 0.10)
    ) * 100.0

    return {
        "completeness_score": completeness,
        "validity_score": validity,
        "consistency_score": consistency,
        "source_agreement_score": source_agreement,
        "quality_score": round(composite, 1)
    }

def aggregate_catalog_quality(products: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not products:
        return {
            "overall_quality_score": 0.0,
            "avg_completeness": 0.0,
            "avg_validity": 0.0,
            "avg_consistency": 0.0,
            "avg_source_agreement": 0.0,
            "quality_distribution": {"excellent": 0, "good": 0, "fair": 0, "poor": 0}
        }
        
    n = len(products)
    total_q = sum(p.get("quality_score", 0.0) for p in products)
    total_comp = sum(p.get("completeness_score", 0.0) for p in products)
    total_val = sum(p.get("validity_score", 0.0) for p in products)
    total_cons = sum(p.get("consistency_score", 0.0) for p in products)
    total_agree = sum(p.get("source_agreement_score", 1.0) for p in products)
    
    dist = {"excellent": 0, "good": 0, "fair": 0, "poor": 0}
    for p in products:
        q = p.get("quality_score", 0.0)
        if q >= 85:
            dist["excellent"] += 1
        elif q >= 70:
            dist["good"] += 1
        elif q >= 50:
            dist["fair"] += 1
        else:
            dist["poor"] += 1
            
    return {
        "overall_quality_score": round(total_q / n, 1),
        "avg_completeness": round((total_comp / n) * 100, 1),
        "avg_validity": round((total_val / n) * 100, 1),
        "avg_consistency": round((total_cons / n) * 100, 1),
        "avg_source_agreement": round((total_agree / n) * 100, 1),
        "quality_distribution": dist
    }
