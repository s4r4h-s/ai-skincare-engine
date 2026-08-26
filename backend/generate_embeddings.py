import json
from sentence_transformers import SentenceTransformer

def generate_product_embeddings():
    print("Loading the Sentence Transformer model (all-MiniLM-L6-v2)...")
    # This loads the AI model that converts text into 384-dimensional vectors
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    print("Reading clean_skincare_data.json...")
    with open("clean_skincare_data.json", "r") as f:
        products = json.load(f)
        
    print(f"Generating embeddings for {len(products)} products... (This might take a minute)")
    
    # Extract all the ingredient strings into a list
    ingredient_texts = [str(p.get("ingredients", "")) for p in products]
    
    # Encode all ingredient strings into vector embeddings in bulk (super fast)
    embeddings = model.encode(ingredient_texts, show_progress_bar=True)
    
    # Attach the generated vector array to each product dictionary
    for i, product in enumerate(products):
        # Convert the numpy array to a standard Python list so JSON/MongoDB can store it
        product["ingredient_vector"] = embeddings[i].tolist()
        
    # Save the vector-enriched data to a new file
    output_file = "vector_skincare_data.json"
    print(f"Saving embedded data to {output_file}...")
    with open(output_file, "w") as f:
        json.dump(products, f, indent=4)
        
    print("Success! All products have been successfully embedded with 384-dimensional AI vectors.")

if __name__ == "__main__":
    generate_product_embeddings()