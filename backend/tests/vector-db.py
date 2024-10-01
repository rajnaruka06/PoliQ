import openai
import psycopg2
import os
import json
from dotenv import load_dotenv

# Loading OpenAI API key from the .env file
load_dotenv(dotenv_path="resources/.ENV")
openai.api_key = os.getenv("OPENAI_API_KEY")

# Connect to PostgreSQL database
def connect_db():
    try:
        conn = psycopg2.connect(
            host="localhost", 
            database="my_vector_db",
            user="postgres",
            password="    "
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

# Generate embeddings using OpenAI
def generate_embedding(text):
    try:
        response = openai.Embedding.create(
            input=text,
            model="text-embedding-ada-002"  # Adjust the model as needed
        )
        return response['data'][0]['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None

# Insert document into PostgreSQL vector DB
def insert_document(conn, content, metadata, embedding):
    try:
        cur = conn.cursor()
        insert_query = """
            INSERT INTO documents (content, metadata, embedding)
            VALUES (%s, %s, %s)
        """
        cur.execute(insert_query, (content, json.dumps(metadata), embedding))
        conn.commit()
        cur.close()
        print("Document inserted successfully.")
    except Exception as e:
        print(f"Error inserting document: {e}")

# Read and process JSON files with dataset structure
def process_json_file(conn, json_file_path):
    try:
        # Load the JSON file
        with open(json_file_path, 'r') as file:
            data = json.load(file)
        
        # Assuming 'datasets' is the key in the JSON that holds all the documents
        datasets = data.get('datasets', [])

        # Process each dataset
        for dataset in datasets:
            # Extract relevant information from each dataset
            content = dataset.get("description", "")
            metadata = {
                "id": dataset.get("id", ""),
                "display_name": dataset.get("display_name", ""),
                "name": dataset.get("name", ""),
                "level": dataset.get("level", ""),
                "series_name": dataset.get("series_name", ""),
                "source": dataset.get("source", {}),
                "query": dataset.get("query", {})
            }

            # Generate embedding for the dataset description (or any other content field)
            embedding = generate_embedding(content)
            
            if embedding:
                # Insert the dataset into the vector database
                insert_document(conn, content, metadata, embedding)

    except Exception as e:
        print(f"Error processing JSON file {json_file_path}: {e}")

# Main function to populate the vector DB
def populate_vector_db(json_folder_path):
    conn = connect_db()
    if conn is None:
        return

    try:
        # Process each JSON file in the folder
        for json_file in os.listdir(json_folder_path):
            if json_file.endswith(".json"):
                json_file_path = os.path.join(json_folder_path, json_file)
                print(f"Processing file: {json_file_path}")
                process_json_file(conn, json_file_path)
    finally:
        # Ensure the connection is closed
        conn.close()

# Run the function with the path to your JSON files
if __name__ == "__main__":
    # Provide the path where your JSON files are stored
    json_folder_path = "resources"
    populate_vector_db(json_folder_path)