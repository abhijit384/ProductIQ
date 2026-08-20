import re
from typing import List, Dict, Any, Tuple

URL_REGEX = re.compile(
    r"^(?:http|https)://"
    r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
    r"localhost|"
    r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
    r"(?::\d+)?"
    r"(?:/?|[/?]\S+)$", re.IGNORECASE
)

IP_RATING_REGEX = re.compile(r"^IP[0-9]{2}[A-Z]?$", re.IGNORECASE)

def validate_product(p: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], str]:
    """
    Validates a single normalized product record against rule-based constraints.
    Returns a list of validation issues and an overall validation_status ('valid', 'warning', 'invalid').
    """
    issues = []
    
    pid = p.get("product_id", "")
    pname = p.get("product_name", "")
    category = p.get("category", "")
    brand = p.get("brand", "")
    price = p.get("price")
    power = p.get("power", "")
    voltage = p.get("voltage", "")
    weight = p.get("weight", "")
    ip_rating = p.get("ip_rating", "")
    prod_url = p.get("product_url", "")
    tech_doc = p.get("technical_document", "")
    desc = p.get("description", "")
    
    # Critical Checks
    if not pid:
        issues.append({
            "field": "product_id",
            "issue_type": "missing_value",
            "severity": "high",
            "message": "Product ID is missing or empty.",
            "raw_value": None
        })
        
    if not pname or len(pname) < 3:
        issues.append({
            "field": "product_name",
            "issue_type": "missing_value",
            "severity": "high",
            "message": "Product name is missing or too short.",
            "raw_value": pname
        })
        
    if not category:
        issues.append({
            "field": "category",
            "issue_type": "missing_value",
            "severity": "high",
            "message": "Category classification is missing.",
            "raw_value": None
        })
        
    if not brand:
        issues.append({
            "field": "brand",
            "issue_type": "missing_value",
            "severity": "medium",
            "message": "Manufacturer/Brand is unspecified.",
            "raw_value": None
        })

    # Numeric / Spec checks
    if price is None:
        # Many industrial catalogs are RFQ/Inquiry based
        issues.append({
            "field": "price",
            "issue_type": "missing_value",
            "severity": "low",
            "message": "Price is not specified or RFQ inquiry based.",
            "raw_value": str(p.get("raw_data", {}).get("price") or "")
        })
    elif price < 0:
        issues.append({
            "field": "price",
            "issue_type": "out_of_range",
            "severity": "high",
            "message": f"Price cannot be negative: {price}",
            "raw_value": str(price)
        })

    if power and not any(unit in power.lower() for unit in ["kw", "w", "kva", "hp", "mw"]):
        issues.append({
            "field": "power",
            "issue_type": "unit_mismatch",
            "severity": "medium",
            "message": f"Power specification does not contain standard unit: {power}",
            "raw_value": power
        })

    if voltage and not any(v_unit in voltage.lower() for v_unit in ["v", "vac", "vdc", "kv"]):
        issues.append({
            "field": "voltage",
            "issue_type": "invalid_format",
            "severity": "low",
            "message": f"Voltage format is non-standard: {voltage}",
            "raw_value": voltage
        })

    if ip_rating:
        if not IP_RATING_REGEX.match(ip_rating) and not ip_rating.startswith("EX"):
            issues.append({
                "field": "ip_rating",
                "issue_type": "invalid_format",
                "severity": "low",
                "message": f"IP Ingress Protection rating is non-standard format: {ip_rating}",
                "raw_value": ip_rating
            })

    if prod_url and not URL_REGEX.match(prod_url):
        issues.append({
            "field": "product_url",
            "issue_type": "invalid_url",
            "severity": "low",
            "message": f"Product URL is invalid or malformed: {prod_url}",
            "raw_value": prod_url
        })

    if tech_doc and not URL_REGEX.match(tech_doc):
        issues.append({
            "field": "technical_document",
            "issue_type": "invalid_url",
            "severity": "low",
            "message": f"Technical document link is malformed: {tech_doc}",
            "raw_value": tech_doc
        })

    if not desc or len(desc) < 20:
        issues.append({
            "field": "description",
            "issue_type": "missing_value",
            "severity": "low",
            "message": "Product description is sparse (< 20 characters) or missing.",
            "raw_value": desc
        })

    # Determine overall status
    has_high = any(issue["severity"] == "high" for issue in issues)
    has_medium = any(issue["severity"] == "medium" for issue in issues)
    
    if has_high:
        status = "invalid"
    elif has_medium:
        status = "warning"
    else:
        status = "valid"
        
    return issues, status
