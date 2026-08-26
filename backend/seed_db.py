import json
import os
import certifi  # <-- NEW: Import the certificate package
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("🚨 ERROR: Python cannot find your MONGO_URI! Check that your .env file is named exactly '.env' and is in the backend folder.")

def seed_database():
    print("Connecting to MongoDB Atlas...")
    
    # <-- NEW: Tell PyMongo to use the trusted certificates
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    
    db = client["skincare_db"]
    collection = db["moisturizers"]
    
    print("Reading local seed.json...")
    with open("seed.json", "r") as f:
        moisturizers_data = json.load(f)
        
    collection.delete_many({})
    
    print(f"Uploading {len(moisturizers_data)} products to the cloud...")
    collection.insert_many(moisturizers_data)
    
    print("Success! Your data is now live in MongoDB Atlas.")

if __name__ == "__main__":
    seed_database()