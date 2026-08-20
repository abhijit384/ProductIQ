import os
import json
import time
import hashlib
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

class AttributeItem(BaseModel):
    name: str = Field(description="Attribute name e.g. rated_power, voltage, rpm")
    value: str = Field(description="Normalized value")
    unit: str = Field(default="", description="Standardized unit e.g. kW, V, RPM, kg, mm")

class EnrichedProductSchema(BaseModel):
    product_id: str = Field(description="Original product identifier")
    category: str = Field(description="Primary industrial category")
    subcategory: str = Field(description="Specific technical subcategory")
    brand: str = Field(description="Normalized manufacturer/brand name")
    model_number: str = Field(description="Normalized model/catalog number")
    attributes: List[AttributeItem] = Field(default_factory=list, description="Extracted key-value technical specifications with standardized units")
    missing_attributes: List[str] = Field(default_factory=list, description="List of important technical attributes missing from the catalog")
    normalized_description: str = Field(description="Clean, concise, professional commercial catalog description")
    commerce_keywords: List[str] = Field(default_factory=list, description="High-converting B2B industrial search terms & SEO keywords")
    confidence_score: float = Field(default=0.95, description="Confidence score between 0.0 and 1.0")
    explanation: str = Field(default="", description="Summary of enrichments and reasoning")

class BatchEnrichmentResponse(BaseModel):
    items: List[EnrichedProductSchema]

class GeminiAIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
        self.client = None
        self.semaphore = asyncio.Semaphore(5)  # Concurrency limit
        self.in_memory_cache: Dict[str, Dict[str, Any]] = {}
        self.stats = {
            "total_requests": 0,
            "cache_hits": 0,
            "api_calls": 0,
            "failed_calls": 0,
            "total_items_enriched": 0,
            "total_attributes_extracted": 0,
            "total_keywords_generated": 0,
            "avg_confidence": 0.0,
            "avg_latency_ms": 0
        }
        self._init_client()

    def _init_client(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key, http_options={"timeout": 12000})
            except Exception as e:
                print(f"[GeminiAIService] Error initializing Google GenAI client: {e}")
                self.client = None
        else:
            self.client = None

    def get_status(self) -> Dict[str, Any]:
        has_key = bool(self.api_key)
        is_ready = self.client is not None
        status_str = "connected" if is_ready else ("unconfigured" if not has_key else "offline")
        
        hit_rate = 0.0
        if self.stats["total_requests"] > 0:
            hit_rate = round((self.stats["cache_hits"] / self.stats["total_requests"]) * 100, 1)

        return {
            "status": status_str,
            "model": self.model_name,
            "has_api_key": has_key,
            "is_connected": is_ready,
            "stats": {
                **self.stats,
                "cache_hit_rate_pct": hit_rate
            }
        }

    def _make_cache_key(self, product: Dict[str, Any]) -> str:
        key_content = f"{product.get('brand')}_{product.get('model_number')}_{product.get('product_name')}_{product.get('power')}_{product.get('voltage')}"
        return hashlib.sha256(key_content.encode("utf-8")).hexdigest()

    def _generate_deterministic_fallback(self, product: Dict[str, Any]) -> Dict[str, Any]:
        pname = product.get("product_name", "")
        cat = product.get("category") or "Industrial Equipment"
        subcat = product.get("subcategory") or "Standard Component"
        brand = product.get("brand") or "Industrial OEM"
        model = product.get("model_number") or "N/A"
        
        attrs = {}
        if product.get("power"):
            attrs["rated_power"] = product.get("power")
        if product.get("voltage"):
            attrs["nominal_voltage"] = product.get("voltage")
        if product.get("frequency"):
            attrs["operating_frequency"] = product.get("frequency")
        if product.get("rpm"):
            attrs["rotational_speed"] = product.get("rpm")
        if product.get("ip_rating"):
            attrs["ingress_protection"] = product.get("ip_rating")
        if product.get("weight"):
            attrs["net_weight"] = product.get("weight")
        if product.get("dimensions"):
            attrs["physical_dimensions"] = product.get("dimensions")
        if product.get("material"):
            attrs["housing_material"] = product.get("material")

        missing = []
        if not product.get("ip_rating"):
            missing.append("IP Rating")
        if not product.get("weight"):
            missing.append("Weight / Mass")
        if not product.get("dimensions"):
            missing.append("Physical Dimensions")
        if not product.get("warranty"):
            missing.append("Warranty Terms")
        if not product.get("technical_document"):
            missing.append("OEM Datasheet PDF")

        keywords = [
            f"{brand} {cat}".lower(),
            f"{model} industrial",
            f"{subcat} B2B",
            f"{brand} spare parts",
            "commercial grade replacement"
        ]

        desc = f"Commercial grade {subcat} manufactured by {brand} (Model: {model}). Engineered for high-duty continuous operation in demanding industrial facilities."
        if product.get("power"):
            desc += f" Rated power specification: {product.get('power')}."
        if product.get("voltage"):
            desc += f" Operating voltage: {product.get('voltage')}."

        return {
            "product_id": product.get("product_id", ""),
            "category": cat,
            "subcategory": subcat,
            "brand": brand,
            "model_number": model,
            "attributes": attrs,
            "missing_attributes": missing,
            "normalized_description": desc,
            "commerce_keywords": keywords,
            "confidence_score": 0.88,
            "explanation": "Deterministic intelligence rule-based extraction and normalization."
        }

    async def enrich_batch(self, batch_products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        needed_ai = []
        needed_indices = []

        start_time = time.time()
        
        for idx, p in enumerate(batch_products):
            self.stats["total_requests"] += 1
            ckey = self._make_cache_key(p)
            if ckey in self.in_memory_cache:
                self.stats["cache_hits"] += 1
                cached_res = dict(self.in_memory_cache[ckey])
                cached_res["product_id"] = p.get("product_id", "")
                results.append((idx, cached_res))
            else:
                needed_ai.append(p)
                needed_indices.append(idx)

        if not needed_ai:
            results.sort(key=lambda x: x[0])
            return [r[1] for r in results]

        # If no client or API key, run deterministic fallback
        if self.client is None:
            for idx, p in zip(needed_indices, needed_ai):
                fallback_res = self._generate_deterministic_fallback(p)
                ckey = self._make_cache_key(p)
                self.in_memory_cache[ckey] = fallback_res
                results.append((idx, fallback_res))
            results.sort(key=lambda x: x[0])
            return [r[1] for r in results]

        # Call Gemini API with concurrency control
        async with self.semaphore:
            prompt = (
                "You are an expert industrial product data intelligence engine. "
                "Analyze the following industrial product records, normalize messy attributes, "
                "classify category/subcategory accurately, identify missing technical attributes, "
                "create a concise B2B catalog description, and generate commercial search keywords.\n\n"
                f"Products to enrich:\n{json.dumps(needed_ai, indent=2)}\n\n"
                "Return a JSON array of enriched objects conforming strictly to the requested schema."
            )
            
            try:
                self.stats["api_calls"] += 1
                
                def _call_gemini():
                    return self.client.models.generate_content(
                        model=self.model_name,
                        contents=prompt,
                        config={
                            "response_mime_type": "application/json",
                            "response_schema": BatchEnrichmentResponse
                        }
                    )

                response = await asyncio.wait_for(
                    asyncio.to_thread(_call_gemini),
                    timeout=8.0
                )
                
                raw_text = response.text
                parsed_data = json.loads(raw_text)
                items = parsed_data.get("items", []) if isinstance(parsed_data, dict) else parsed_data
                
                for i, p in enumerate(needed_ai):
                    idx = needed_indices[i]
                    if i < len(items):
                        raw_item = items[i]
                        # Convert attributes list to dict
                        attr_dict = {}
                        for attr in raw_item.get("attributes", []):
                            if isinstance(attr, dict):
                                attr_dict[attr.get("name")] = f"{attr.get('value')} {attr.get('unit', '')}".strip()
                        raw_item["attributes"] = attr_dict
                        raw_item["product_id"] = p.get("product_id", "")
                        item_res = raw_item
                    else:
                        item_res = self._generate_deterministic_fallback(p)
                        
                    ckey = self._make_cache_key(p)
                    self.in_memory_cache[ckey] = item_res
                    results.append((idx, item_res))
                    
                    self.stats["total_items_enriched"] += 1
                    self.stats["total_attributes_extracted"] += len(item_res.get("attributes", {}))
                    self.stats["total_keywords_generated"] += len(item_res.get("commerce_keywords", []))

            except Exception as e:
                print(f"[GeminiAIService] API error: {e}. Using deterministic fallback.")
                self.stats["failed_calls"] += 1
                for idx, p in zip(needed_indices, needed_ai):
                    fallback_res = self._generate_deterministic_fallback(p)
                    ckey = self._make_cache_key(p)
                    self.in_memory_cache[ckey] = fallback_res
                    results.append((idx, fallback_res))

        latency = int((time.time() - start_time) * 1000)
        self.stats["avg_latency_ms"] = latency

        results.sort(key=lambda x: x[0])
        return [r[1] for r in results]

# Singleton instance
ai_service = GeminiAIService()
