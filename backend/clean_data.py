import pandas as pd
import json

def clean_sephora_data():
    print("Loading raw Sephora dataset...")
    # 1. Load the massive CSV
    df = pd.read_csv("product_info.csv")

    # 2. Keep only the columns we actually need for the app
    columns_to_keep = [
        "product_id", 
        "product_name", 
        "brand_name", 
        "ingredients", 
        "price_usd", 
        "primary_category",
        "secondary_category"
    ]
    df = df[columns_to_keep]

    # 3. Filter strictly for Skincare products
    df = df[df["primary_category"] == "Skincare"]

    # 4. Drop any rows missing an ingredient list (our AI pipeline needs this text!)
    df = df.dropna(subset=["ingredients"])

    # 5. Convert the DataFrame into a list of dictionaries (MongoDB's native format)
    cleaned_data = df.to_dict(orient="records")

    # 6. Save the perfectly formatted data to a new JSON file
    with open("clean_skincare_data.json", "w") as f:
        json.dump(cleaned_data, f, indent=4)

    print(f"Success! Filtered down to {len(cleaned_data)} pure skincare products.")

if __name__ == "__main__":
    clean_sephora_data()