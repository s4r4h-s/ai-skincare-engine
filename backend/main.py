from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import certifi
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

# 1. Load Environment Variables & AI Model
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

print("Loading Sentence Transformer model for API...")
model = SentenceTransformer('all-MiniLM-L6-v2')

app = FastAPI()

# 2. CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Connect to MongoDB Atlas
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client["skincare_db"]
collection = db["moisturizers"]

# 4. API Endpoints
@app.get("/")
def read_root():
    return {"message": "AI-Powered Skincare Vector Search API is running!"}

@app.get("/api/moisturizers")
def get_all_moisturizers():
    # Exclude _id and ingredient_vector to keep the payload clean and fast
    products = list(collection.find({}, {"_id": 0, "ingredient_vector": 0}).limit(50))
    return products

class RoutineRequest(BaseModel):
    product_ids: List[str]

@app.post("/api/evaluate-routine")
def evaluate_routine(request: RoutineRequest):
    if not request.product_ids:
        return {"conflicts": [], "warnings": [], "message": "No products in routine."}

    try:
        from bson.objectid import ObjectId
        obj_ids = [ObjectId(pid) for pid in request.product_ids if len(pid) == 24]
        query = {"$or": [{"_id": {"$in": request.product_ids}}, {"_id": {"$in": obj_ids}}]}
    except Exception:
        query = {"_id": {"$in": request.product_ids}}
        
    products = list(collection.find(query))
    
    if not products:
        raise HTTPException(status_code=404, detail="Products not found")

    all_actives = set()
    for prod in products:
        # Check active_ingredients first, then fallback to full_ingredient_list if needed
        actives = [a.lower() for a in prod.get("active_ingredients", [])]
        if not actives:
            actives = [a.lower() for a in prod.get("full_ingredient_list", [])]
        all_actives.update(actives)

    conflicts = []
    
    retinoid_keywords = ["retinol", "tretinoin", "adapalene", "retin-a", "retinoid"]
    aha_bha_keywords = ["glycolic acid", "salicylic acid", "lactic acid", "mandelic acid", "aha", "bha"]
    vit_c_keywords = ["vitamin c", "ascorbic acid", "l-ascorbic acid"]
    bp_keywords = ["benzoyl peroxide"]
    
    has_retinoid = any(any(kw in act for kw in retinoid_keywords) for act in all_actives)
    has_aha_bha = any(any(kw in act for kw in aha_bha_keywords) for act in all_actives)
    has_vit_c = any(any(kw in act for kw in vit_c_keywords) for act in all_actives)
    has_bp = any(any(kw in act for kw in bp_keywords) for act in all_actives)
    
    if has_retinoid and has_aha_bha:
        conflicts.append({
            "type": "Retinoid + AHA/BHA",
            "severity": "High",
            "message": "Using retinoids with exfoliating acids (AHA/BHA) can cause severe irritation, dryness, and compromise your skin barrier. Consider using them on alternating nights."
        })
        
    if has_retinoid and has_vit_c:
        conflicts.append({
            "type": "Retinoid + Vitamin C",
            "severity": "Medium",
            "message": "Combining Vitamin C (usually applied in the morning) with Retinoids (applied at night) at the same time can cause irritation. Keep Vitamin C for AM and Retinoid for PM."
        })
        
    if has_bp and has_retinoid:
        conflicts.append({
            "type": "Benzoyl Peroxide + Retinoid",
            "severity": "High",
            "message": "Benzoyl Peroxide can deactivate certain retinoids and cause extreme dryness. Use at different times of the day."
        })
        
    if has_bp and has_vit_c:
        conflicts.append({
            "type": "Benzoyl Peroxide + Vitamin C",
            "severity": "Medium",
            "message": "Benzoyl Peroxide can oxidize Vitamin C, making it less effective. Apply them at different times."
        })

    warnings = []
    has_ceramides_hyaluronic = any(any(kw in act for kw in ["ceramide", "hyaluronic acid", "squalane", "glycerin"]) for act in all_actives)
    
    if (has_retinoid or has_aha_bha or has_bp) and not has_ceramides_hyaluronic:
        warnings.append("Your routine contains strong actives but lacks barrier-supporting ingredients (like Ceramides or Hyaluronic Acid). Ensure you are using a very supportive moisturizer.")

    for p in products:
        p["_id"] = str(p["_id"])
            
    return {
        "evaluated_products": [p.get("name") or p.get("product_name") for p in products],
        "conflicts": conflicts,
        "warnings": warnings
    }