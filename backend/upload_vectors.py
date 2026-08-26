import json
import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("🚨 ERROR: Python cannot find your MONGO_URI!")

def upload_vector_data():
    print("Connecting to MongoDB Atlas...")
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    
    db = client["skincare_db"]
    collection = db["moisturizers"]
    
    print("Reading vector_skincare_data.json...")
    with open("vector_skincare_data.json", "r") as f:
        products = json.load(f)
        
    # Clear out the old raw data collection
    collection.delete_many({})
    
    print(f"Uploading {len(products)} vector-embedded products to MongoDB Atlas...")
    collection.insert_many(products)
    
    print("Success! Vector-enabled data is live in the cloud.")

if __name__ == "__main__":
    upload_vector_data()