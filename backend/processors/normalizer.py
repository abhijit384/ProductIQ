import re
from typing import Dict, Any, Tuple, Optional

BRAND_CANONICAL = {
    "abb": "ABB",
    "siemens": "Siemens",
    "siemens simatic": "Siemens",
    "weg": "WEG",
    "baldor-reliance": "Baldor-Reliance",
    "baldor": "Baldor-Reliance",
    "nidec": "Nidec",
    "sew-eurodrive": "SEW-Eurodrive",
    "grundfos": "Grundfos",
    "ksb": "KSB",
    "flowserve": "Flowserve",
    "sulzer": "Sulzer",
    "wilo": "Wilo",
    "xylem": "Xylem",
    "emerson": "Emerson",
    "emerson fisher": "Emerson Fisher",
    "emerson rosemount": "Emerson Rosemount",
    "samson": "Samson",
    "bray": "Bray",
    "velan": "Velan",
    "kitz": "Kitz",
    "endress+hauser": "Endress+Hauser",
    "yokogawa": "Yokogawa",
    "ifm electronic": "IFM Electronic",
    "ifm": "IFM Electronic",
    "sick": "Sick",
    "honeywell": "Honeywell",
    "honeywell analytics": "Honeywell Analytics",
    "skf": "SKF",
    "nsk": "NSK",
    "fag": "FAG Schaeffler",
    "fag schaeffler": "FAG Schaeffler",
    "timken": "Timken",
    "ntn": "NTN",
    "koyo": "Koyo",
    "atlas copco": "Atlas Copco",
    "ingersoll rand": "Ingersoll Rand",
    "kaeser": "Kaeser",
    "sullair": "Sullair",
    "boge": "Boge",
    "gardner denver": "Gardner Denver",
    "rockwell": "Rockwell Allen-Bradley",
    "rockwell allen-bradley": "Rockwell Allen-Bradley",
    "allen-bradley": "Rockwell Allen-Bradley",
    "schneider": "Schneider Electric",
    "schneider electric": "Schneider Electric",
    "schneider galaxy": "Schneider Galaxy",
    "mitsubishi": "Mitsubishi Electric",
    "mitsubishi electric": "Mitsubishi Electric",
    "omron": "Omron",
    "eaton": "Eaton",
    "legrand": "Legrand",
    "chint": "Chint",
    "pilz": "Pilz",
    "euchner": "Euchner",
    "banner": "Banner Engineering",
    "banner engineering": "Banner Engineering",
    "pepperl+fuchs": "Pepperl+Fuchs",
    "caterpillar": "Caterpillar",
    "cummins": "Cummins",
    "vertiv": "Vertiv Liebert",
    "vertiv liebert": "Vertiv Liebert",
    "sma": "SMA Solar",
    "sma solar": "SMA Solar",
    "huawei": "Huawei Digital Power",
    "huawei digital power": "Huawei Digital Power"
}

def clean_text(val: Any) -> str:
    if val is None:
        return ""
    s = str(val).strip()
    if s.lower() in ("nan", "none", "null", "n/a", "na", "-"):
        return ""
    # Strip HTML tags
    s = re.sub(r"<[^>]+>", " ", s)
    # Collapse multiple spaces
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def normalize_brand(raw_brand: str) -> str:
    cleaned = clean_text(raw_brand)
    if not cleaned:
        return ""
    lower = cleaned.lower()
    return BRAND_CANONICAL.get(lower, cleaned)

def normalize_power(raw_power: str) -> Tuple[str, Optional[float]]:
    cleaned = clean_text(raw_power)
    if not cleaned:
        return "", None
    
    # HP to kW: 1 HP = 0.7457 kW
    hp_match = re.search(r"([\d\.]+)\s*(?:hp|horse\s*power)", cleaned, re.IGNORECASE)
    if hp_match:
        val = float(hp_match.group(1))
        kw_val = round(val * 0.7457, 2)
        return f"{kw_val} kW", kw_val
        
    # Watts to kW
    w_match = re.search(r"([\d\.]+)\s*(?:w|watts)(?!\w)", cleaned, re.IGNORECASE)
    if w_match:
        val = float(w_match.group(1))
        kw_val = round(val / 1000.0, 3)
        return f"{kw_val} kW", kw_val
        
    # MW to kW
    mw_match = re.search(r"([\d\.]+)\s*(?:mw|megawatts)", cleaned, re.IGNORECASE)
    if mw_match:
        val = float(mw_match.group(1))
        kw_val = round(val * 1000.0, 2)
        return f"{kw_val} kW", kw_val

    # kVA
    kva_match = re.search(r"([\d\.]+)\s*(?:kva)", cleaned, re.IGNORECASE)
    if kva_match:
        val = float(kva_match.group(1))
        return f"{val} kVA", val

    # kW
    kw_match = re.search(r"([\d\.]+)\s*(?:kw|kilowatts)", cleaned, re.IGNORECASE)
    if kw_match:
        val = float(kw_match.group(1))
        return f"{val} kW", val
        
    # Generic numeric
    num_match = re.search(r"^([\d\.]+)$", cleaned)
    if num_match:
        val = float(num_match.group(1))
        return f"{val} kW", val

    return cleaned, None

def normalize_voltage(raw_voltage: str) -> str:
    cleaned = clean_text(raw_voltage)
    if not cleaned:
        return ""
    
    # kV to V
    kv_match = re.search(r"([\d\.]+)\s*(?:kv|kilovolts)", cleaned, re.IGNORECASE)
    if kv_match:
        val = float(kv_match.group(1))
        v_val = int(val * 1000)
        return f"{v_val} V"
        
    # V / VAC / VDC
    v_match = re.search(r"([\d\.\-]+)\s*(?:v(?:olts?)?|vac|vdc)", cleaned, re.IGNORECASE)
    if v_match:
        val_str = v_match.group(1)
        dc = " DC" if "dc" in cleaned.lower() else ""
        ac = " AC" if "ac" in cleaned.lower() else ""
        return f"{val_str} V{dc}{ac}".strip()
        
    return cleaned

def normalize_frequency(raw_freq: str) -> str:
    cleaned = clean_text(raw_freq)
    if not cleaned:
        return ""
    if re.search(r"50[\s/]*60\s*hz", cleaned, re.IGNORECASE):
        return "50/60 Hz"
    if re.search(r"50\s*hz", cleaned, re.IGNORECASE):
        return "50 Hz"
    if re.search(r"60\s*hz", cleaned, re.IGNORECASE):
        return "60 Hz"
    if cleaned.lower() in ("dc", "direct current"):
        return "DC"
    return cleaned

def normalize_rpm(raw_rpm: str) -> str:
    cleaned = clean_text(raw_rpm)
    if not cleaned:
        return ""
    num_match = re.search(r"(\d+)\s*(?:rpm)?", cleaned, re.IGNORECASE)
    if num_match:
        return f"{num_match.group(1)} RPM"
    return cleaned

def normalize_weight(raw_weight: str) -> str:
    cleaned = clean_text(raw_weight)
    if not cleaned:
        return ""
    
    # lbs to kg (1 lb = 0.453592 kg)
    lbs_match = re.search(r"([\d\.]+)\s*(?:lbs?|pounds?)", cleaned, re.IGNORECASE)
    if lbs_match:
        val = float(lbs_match.group(1))
        kg_val = round(val * 0.453592, 1)
        return f"{kg_val} kg"
        
    # grams to kg
    g_match = re.search(r"([\d\.]+)\s*(?:g|grams?)(?!\w)", cleaned, re.IGNORECASE)
    if g_match:
        val = float(g_match.group(1))
        kg_val = round(val / 1000.0, 2)
        return f"{kg_val} kg"
        
    # kg
    kg_match = re.search(r"([\d\.]+)\s*(?:kg|kilograms?|\.)", cleaned, re.IGNORECASE)
    if kg_match:
        val = float(kg_match.group(1))
        return f"{val} kg"
        
    return cleaned

def normalize_dimensions(raw_dim: str) -> str:
    cleaned = clean_text(raw_dim)
    if not cleaned:
        return ""
    # Look for 3 numbers (LxWxH)
    m = re.findall(r"[\d\.]+", cleaned)
    if len(m) >= 3:
        # Check if inches
        if '"' in cleaned or "inch" in cleaned.lower():
            try:
                l = round(float(m[0]) * 25.4)
                w = round(float(m[1]) * 25.4)
                h = round(float(m[2]) * 25.4)
                return f"{l} x {w} x {h} mm"
            except Exception:
                pass
        # Check if cm
        if "cm" in cleaned.lower():
            try:
                l = round(float(m[0]) * 10)
                w = round(float(m[1]) * 10)
                h = round(float(m[2]) * 10)
                return f"{l} x {w} x {h} mm"
            except Exception:
                pass
        return f"{m[0]} x {m[1]} x {m[2]} mm"
    return cleaned

def normalize_ip_rating(raw_ip: str) -> str:
    cleaned = clean_text(raw_ip)
    if not cleaned:
        return ""
    m = re.search(r"ip\s*([0-9]{2}[a-z]?)", cleaned, re.IGNORECASE)
    if m:
        return f"IP{m.group(1).upper()}"
    if "ex d" in cleaned.lower():
        return cleaned.upper()
    return cleaned

def normalize_price_currency(raw_price: Any, raw_currency: Any) -> Tuple[Optional[float], str]:
    curr_str = clean_text(raw_currency).upper()
    price_val = None
    
    p_str = str(raw_price).strip() if raw_price is not None else ""
    
    # Currency symbol detections
    if "$" in p_str or curr_str == "$":
        curr_str = "USD"
    elif "€" in p_str or curr_str == "€":
        curr_str = "EUR"
    elif "£" in p_str or curr_str == "£":
        curr_str = "GBP"
    elif not curr_str:
        curr_str = "USD"
        
    num_match = re.search(r"([\d\.,]+)", p_str)
    if num_match:
        val_cleaned = num_match.group(1).replace(",", "")
        try:
            price_val = round(float(val_cleaned), 2)
        except ValueError:
            price_val = None
            
    return price_val, curr_str

def normalize_product_record(raw: Dict[str, Any], schema_mapping: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Applies deterministic normalization to a raw product record.
    Supports flexible canonical schema mapping for arbitrary dataset columns.
    """
    norm: Dict[str, Any] = {}
    additional_attributes: Dict[str, Any] = {}
    
    # 1. Apply Schema Mapping if provided
    canonical_mapped: Dict[str, Any] = {}
    if schema_mapping:
        for raw_col, val in raw.items():
            if not raw_col:
                continue
            clean_raw_col = str(raw_col).strip()
            canon_field = schema_mapping.get(clean_raw_col) or schema_mapping.get(raw_col)
            if canon_field and canon_field != "additional_attributes":
                # Handle potential duplicate canonical mappings (e.g. E1_Brand & Unilog_Brand)
                if canon_field in canonical_mapped and canonical_mapped[canon_field]:
                    # Preserve secondary brand/fields in additional attributes
                    additional_attributes[clean_raw_col] = val
                else:
                    canonical_mapped[canon_field] = val
            else:
                if val is not None and str(val).strip():
                    additional_attributes[clean_raw_col] = val
    else:
        # Fallback to direct raw keys
        canonical_mapped = dict(raw)
        
    def get_val(*keys: str) -> Any:
        for k in keys:
            if k in canonical_mapped and canonical_mapped[k] is not None:
                cleaned = clean_text(canonical_mapped[k])
                if cleaned:
                    return cleaned
            if k in raw and raw[k] is not None:
                cleaned = clean_text(raw[k])
                if cleaned:
                    return cleaned
        return ""

    # Identifiers
    prod_id = get_val("product_identifier", "product_id", "id", "item_code", "product_code", "sku", "mpn", "mfg_part_num")
    mpn = get_val("mpn", "mfg_part_num", "part_number", "partnumber", "model_number", "model")
    sku = get_val("sku", "stock_code", "inventory_id")
    model_num = get_val("model_number", "model", "model_no", "mpn", "sku")
    
    # Brand / Manufacturer / Supplier
    brand = normalize_brand(get_val("brand", "brand_name", "e1_brand", "unilog_brand", "manufacturer", "maker", "part_manuf"))
    manufacturer = normalize_brand(get_val("manufacturer", "maker", "part_manuf", "brand", "brand_name"))
    if not brand and manufacturer:
        brand = manufacturer
    if not manufacturer and brand:
        manufacturer = brand
    supplier = get_val("supplier", "vendor", "distributor", "seller")
    
    # Names & Descriptions
    desc = get_val("product_description", "description", "desc", "part_desc", "longdescription", "details")
    # Clean promotional noise
    if desc:
        desc = re.sub(r"\*{2,}[^*]+\*{2,}", "", desc).strip()
        
    name = get_val("product_name", "name", "title", "item_name", "product_title")
    if not name:
        # Dynamic synthesis of product name
        if desc:
            first_sent = desc.split(".")[0].strip()
            name = first_sent[:90] if len(first_sent) > 5 else desc[:90]
        elif brand and (model_num or mpn):
            name = f"{brand} {model_num or mpn}".strip()
        elif mpn or prod_id:
            name = f"Industrial Component {mpn or prod_id}".strip()
        else:
            name = "Industrial Equipment Component"
            
    if not desc and name:
        desc = f"{name}. Certified industrial component specification."
        
    # Categories
    category = get_val("category", "cat", "product_category", "department", "division")
    if not category:
        category = "Industrial Equipment"
    subcategory = get_val("subcategory", "sub_category", "subcat", "type", "class")

    # Specifications
    raw_price = canonical_mapped.get("price") if "price" in canonical_mapped else raw.get("price")
    raw_currency = canonical_mapped.get("currency") if "currency" in canonical_mapped else raw.get("currency")
    price, currency = normalize_price_currency(raw_price, raw_currency)
    
    power_raw = get_val("power", "powerrating", "wattage", "rated_power", "hp", "kw")
    norm_power, _ = normalize_power(power_raw) if power_raw else ("", None)
    
    voltage_raw = get_val("voltage", "voltagerating", "volts", "rated_voltage", "nominal_voltage")
    norm_voltage = normalize_voltage(voltage_raw) if voltage_raw else ""
    
    freq_raw = get_val("frequency", "freq", "line_frequency", "hz")
    norm_freq = normalize_frequency(freq_raw) if freq_raw else ""
    
    rpm_raw = get_val("rpm", "speed", "rotational_speed")
    norm_rpm = normalize_rpm(rpm_raw) if rpm_raw else ""
    
    weight_raw = get_val("weight", "weightkg", "weight_kg", "mass", "net_weight")
    norm_weight = normalize_weight(weight_raw) if weight_raw else ""
    
    dim_raw = get_val("dimensions", "dim", "size", "lxwxh")
    norm_dim = normalize_dimensions(dim_raw) if dim_raw else ""
    
    material = get_val("material", "housing_material", "construction")
    
    ip_raw = get_val("ip_rating", "ip_code", "ingress_protection", "protection_rating")
    norm_ip = normalize_ip_rating(ip_raw) if ip_raw else ""
    
    warranty = get_val("warranty", "warranty_period", "guarantee")
    country = get_val("country", "country_of_origin", "coo", "origin")
    source = get_val("source", "data_source") or "Uploaded Catalog"
    tech_doc = get_val("technical_document", "datasheet", "spec_sheet", "pdf_url")
    
    prod_url = get_val("product_url", "url", "link")
    if prod_url and not prod_url.startswith("http://") and not prod_url.startswith("https://"):
        if "." in prod_url and "/" in prod_url:
            prod_url = f"https://{prod_url}"

    norm["product_id"] = prod_id
    norm["mpn"] = mpn
    norm["sku"] = sku
    norm["product_name"] = name
    norm["brand"] = brand
    norm["manufacturer"] = manufacturer
    norm["supplier"] = supplier
    norm["category"] = category
    norm["subcategory"] = subcategory
    norm["model_number"] = model_num
    norm["description"] = desc
    norm["price"] = price
    norm["currency"] = currency
    norm["voltage"] = norm_voltage
    norm["power"] = norm_power
    norm["frequency"] = norm_freq
    norm["rpm"] = norm_rpm
    norm["weight"] = norm_weight
    norm["dimensions"] = norm_dim
    norm["material"] = material
    norm["ip_rating"] = norm_ip
    norm["warranty"] = warranty
    norm["country"] = country
    norm["source"] = source
    norm["technical_document"] = tech_doc
    norm["product_url"] = prod_url
    norm["additional_attributes"] = additional_attributes
    
    return norm

