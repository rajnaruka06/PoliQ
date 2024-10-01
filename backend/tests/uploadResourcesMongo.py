import os
from pymongo import MongoClient
from dotenv import load_dotenv
import json

recourcesPath = os.path.join(os.path.dirname(__file__), '../resources')
envPath = os.path.join(recourcesPath, '.ENV')
load_dotenv(dotenv_path=envPath)

client = MongoClient(os.getenv('MONGODB_URI'))
db = client['Resources']

def upload_file(file_path):
    file_name = os.path.basename(file_path)
    file_extension = os.path.splitext(file_name)[1].lower()

    if file_extension == '.txt':
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
    elif file_extension == '.json':
        
        file_name = file_name.replace('.json', '')
        
        if file_name.lower().startswith('_archive'):
            collection = db['archive']
            file_name = file_name.replace('_archive_', '')
        elif file_name.lower().startswith('metadata'):
            collection = db['metadata']
            file_name = file_name.replace('metadata', '')
        else:
            collection = db[file_name]
        
        with open(file_path, 'r', encoding='utf-8') as file:
            content = json.load(file)

        collection.insert_one({
            'name': file_name,
            'content': content
        })
    else:
        print(f"Unsupported file type: {file_extension}")


def main():    
    for filename in os.listdir(recourcesPath):
        file_path = os.path.join(recourcesPath, filename)
        if os.path.isfile(file_path):
            upload_file(file_path)

    print("All files have been processed and uploaded to MongoDB.")

if __name__ == "__main__":
    main()
