import re
from typing import List, Dict, Any, Tuple
from collections import defaultdict
from rapidfuzz import fuzz

def normalize_key_string(s: str) -> str:
    if not s:
        return ""
    # Strip special chars, lower
    return re.sub(r"[^a-zA-Z0-9]", "", s).lower()

def compute_similarity(prod_a: Dict[str, Any], prod_b: Dict[str, Any]) -> float:
    # 1. Exact model number match (with same/similar brand) -> very high
    model_a = normalize_key_string(prod_a.get("model_number", ""))
    model_b = normalize_key_string(prod_b.get("model_number", ""))
    brand_a = normalize_key_string(prod_a.get("brand", ""))
    brand_b = normalize_key_string(prod_b.get("brand", ""))
    
    if model_a and model_b and model_a == model_b:
        if brand_a == brand_b or not brand_a or not brand_b:
            return 0.95
        return 0.85
        
    name_a = prod_a.get("product_name", "").lower()
    name_b = prod_b.get("product_name", "").lower()
    
    if not name_a or not name_b:
        return 0.0
        
    token_score = fuzz.token_sort_ratio(name_a, name_b) / 100.0
    partial_score = fuzz.partial_ratio(name_a, name_b) / 100.0
    
    # Combined weighted score
    sim = (token_score * 0.7) + (partial_score * 0.3)
    
    # If same brand and same category, boost slightly
    if brand_a and brand_b and brand_a == brand_b:
        cat_a = normalize_key_string(prod_a.get("category", ""))
        cat_b = normalize_key_string(prod_b.get("category", ""))
        if cat_a == cat_b:
            sim = min(1.0, sim * 1.08)
            
    return round(sim, 3)

def detect_duplicates(products: List[Dict[str, Any]], threshold: float = 0.80) -> List[Dict[str, Any]]:
    """
    Fast duplicate detection using blocking keys on brand and category/model prefix,
    followed by fuzzy matching within blocks.
    """
    duplicate_groups = []
    visited_indices = set()
    
    # Blocking by (brand, category) or (model prefix)
    blocks = defaultdict(list)
    for idx, p in enumerate(products):
        brand_k = normalize_key_string(p.get("brand", "generic"))[:6]
        cat_k = normalize_key_string(p.get("category", "all"))[:6]
        model_k = normalize_key_string(p.get("model_number", ""))[:5]
        
        blocks[(brand_k, cat_k)].append(idx)
        if model_k:
            blocks[("model_prefix", model_k)].append(idx)
            
    group_counter = 1
    
    for block_key, indices in blocks.items():
        # Remove already visited from candidate list
        cand_indices = list(set(indices))
        n = len(cand_indices)
        if n < 2:
            continue
            
        for i in range(n):
            idx_a = cand_indices[i]
            if idx_a in visited_indices:
                continue
                
            group_members = [idx_a]
            max_sim = 0.0
            
            for j in range(i + 1, n):
                idx_b = cand_indices[j]
                if idx_b in visited_indices:
                    continue
                    
                sim = compute_similarity(products[idx_a], products[idx_b])
                if sim >= threshold:
                    group_members.append(idx_b)
                    if sim > max_sim:
                        max_sim = sim
                        
            if len(group_members) > 1:
                for member_idx in group_members:
                    visited_indices.add(member_idx)
                    
                canonical = products[group_members[0]]
                duplicate_groups.append({
                    "group_code": f"DUP-{group_counter:04d}",
                    "canonical_index": group_members[0],
                    "canonical_product_id": canonical.get("product_id"),
                    "canonical_name": canonical.get("product_name"),
                    "similarity_score": round(max_sim if max_sim > 0 else threshold, 2),
                    "status": "pending",
                    "member_indices": group_members,
                    "members": [
                        {
                            "index": m_idx,
                            "product_id": products[m_idx].get("product_id"),
                            "product_name": products[m_idx].get("product_name"),
                            "brand": products[m_idx].get("brand"),
                            "model_number": products[m_idx].get("model_number"),
                            "price": products[m_idx].get("price"),
                            "power": products[m_idx].get("power"),
                            "voltage": products[m_idx].get("voltage"),
                            "source": products[m_idx].get("source"),
                            "similarity_score": round(compute_similarity(canonical, products[m_idx]), 2) if m_idx != group_members[0] else 1.0
                        }
                        for m_idx in group_members
                    ]
                })
                group_counter += 1

    return duplicate_groups
