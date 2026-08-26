import json
import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

# 1. Load your cloud connection string from .env
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("🚨 ERROR: Python cannot find your MONGO_URI! Check your .env file.")

def upload_kaggle_data():
    print("Connecting to MongoDB Atlas...")
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    
    db = client["skincare_db"]
    collection = db["moisturizers"]
    
    print("Reading clean_skincare_data.json...")
    with open("clean_skincare_data.json", "r") as f:
        products = json.load(f)
        
    # Clear out the old 5 sample products so we make room for the massive dataset
    collection.delete_many({})
    
    print(f"Uploading {len(products)} products to MongoDB Atlas...")
    collection.insert_many(products)
    
    print("Success! Your massive Kaggle dataset is now live in the cloud database.")

if __name__ == "__main__":
    upload_kaggle_data()