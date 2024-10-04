import os
import pymongo
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv('MONGODB_URI'))
db = client['Resources']

def upload_file(file_path):
    file_name = os.path.basename(file_path)
    file_extension = os.path.splitext(file_name)[1].lower()

    if file_extension != '.txt':
        print(f"Skipping file {file_name} as it's not a text file.")
        return

    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    file_name = file_name.replace('.txt', '')
    if file_name.lower().startswith('_archive'):
        collection = db['archive']
        file_name = file_name.replace('_archive_', '')
    elif file_name.lower().startswith('metadata'):
        collection = db['metadata']
        file_name = file_name.replace('metadata', '')
    else:
        collection = db[file_name]
    file_name = file_name.replace('.txt', '')
    collection.insert_one({
        'name': file_name,
        'content': content
    })

def main():
    current_directory = os.path.dirname(os.path.abspath(__file__))
    
    for filename in os.listdir(current_directory):
        file_path = os.path.join(current_directory, filename)
        if os.path.isfile(file_path):
            upload_file(file_path)

    print("All files have been processed and uploaded to MongoDB.")

if __name__ == "__main__":
    main()
