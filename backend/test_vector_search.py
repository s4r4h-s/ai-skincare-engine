import certifi
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

def test_search():
    print("Connecting to MongoDB Atlas...")
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client["skincare_db"]
    collection = db["moisturizers"]
    
    print("Loading Sentence Transformer model to encode search query...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Let's search for a dupe/product with soothing hydration ingredients
    query_text = "soothing squalane and hyaluronic acid deep hydration moisturizer"
    query_vector = model.encode(query_text).tolist()
    
    print(f"\nSearching for products similar to: '{query_text}'...\n")
    
    # Execute MongoDB Atlas $vectorSearch aggregation pipeline
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
                "path": "ingredient_vector",
                "queryVector": query_vector,
                "numCandidates": 50,
                "limit": 3
            }
        },
        {
            "$project": {
                "product_name": 1,
                "brand_name": 1,
                "price_usd": 1,
                "score": {"$meta": "vectorSearchScore"}
            }
        }
    ]
    
    results = list(collection.aggregate(pipeline))
    
    print("Top 3 AI Semantic Matches:")
    for i, res in enumerate(results, 1):
        print(f"{i}. {res.get('brand_name')} - {res.get('product_name')} (${res.get('price_usd')}) [Score: {res.get('score'):.4f}]")

if __name__ == "__main__":
    test_search()