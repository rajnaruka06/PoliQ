## Agent_Helpers.py

from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_community.tools import DuckDuckGoSearchRun
import tiktoken
from PyPDF2 import PdfReader
from pymongo import MongoClient, TEXT
from bson import ObjectId
import gridfs
import io
import os
from dotenv import load_dotenv
import pandas as pd
import re
import ast
from decimal import Decimal
import datetime
import json
import logging
from typing import Tuple


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
env_path = os.path.join(os.path.dirname(__file__), '../Resources/.ENV')
load_dotenv(dotenv_path=env_path)

class DDLCommandException(Exception):
    "Raised when SQL contains DDL commands (CREATE, DELETE, UPDATE, ALTER)"
    def __init__(self, message="SQL contains DDL commands (CREATE, DELETE, UPDATE, ALTER)"):
        self.message = message
        super().__init__(self.message)

class NoDataFoundException(Exception):
    "Raised when no data is fetched from the database"
    def __init__(self, message="No data fetched from the database"):
        self.message = message
        super().__init__(self.message)

class InvalidUserQueryException(Exception):
    "Raised when the query is not related to the Database Schema or cannot be answered from the database"
    def __init__(self, message="Query is not related to the Database Schema or cannot be answered from the database"):
        self.message = message
        super().__init__(self.message)

class NoResultsFoundException(Exception):
    """Exception raised when no search results are found."""
    def __init__(self, message="No search results found"):
        self.message = message
        super().__init__(self.message)


def load_polimap_postgres() -> SQLDatabase:
    user = os.environ.get('POSTGRES_USER')
    password = os.environ.get('POSTGRES_PASSWORD')
    host = os.environ.get('POSTGRES_HOST')
    port = os.environ.get('POSTGRES_PORT')
    dbname = os.environ.get('POLIMAP_DB_NAME')
    uri = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{dbname}"
    db = SQLDatabase.from_uri(uri)

    return db

def load_elecdata_postgres() -> SQLDatabase:
    user = os.environ.get('POSTGRES_USER')
    password = os.environ.get('POSTGRES_PASSWORD')
    host = os.environ.get('POSTGRES_HOST')
    port = os.environ.get('POSTGRES_PORT')
    dbname = os.environ.get('ELECDATA_DB_NAME')
    uri = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{dbname}"
    db = SQLDatabase.from_uri(uri)

    return db

def load_openai(model: str = 'gpt-4o', temperature: int = 0, max_tokens: int = None, timeout: int = None, max_retries: int = 2) -> ChatOpenAI:
    llm = ChatOpenAI(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=timeout,
        max_retries=max_retries
    )
    return llm

def load_anthropic(model: str = 'claude-3-opus-20240229', temperature: int = 0, timeout: int = None, max_retries: int = 2) -> ChatAnthropic:
    llm = ChatAnthropic(
        model=model,
        temperature=temperature,
        timeout=timeout,
        max_retries=max_retries
    )
    return llm

def load_llm(llm_name: str = 'gpt', model: str = 'gpt-4o', temperature: int = 0, max_tokens: int = None, timeout: int = None, max_retries: int = 2):
    if llm_name == 'gpt':
        llm = load_openai(model=model, temperature=temperature, max_tokens=max_tokens, timeout=timeout, max_retries=max_retries)
    elif llm_name == 'claude':
        llm = load_anthropic(model=model, temperature=temperature, timeout=timeout, max_retries=max_retries)
    else:
        raise ValueError(f"Invalid LLM name: {llm_name}")
    
    return llm

def load_polimap_schema(table_names: list = []) -> str:
    db = load_polimap_postgres()
    schema_info = db.get_table_info(table_names=table_names)
    return schema_info

def load_db_info():
    mongo_uri = os.environ.get("MONGO_URI")
    db_name = os.environ.get("MONGO_DB_NAME")
    client = MongoClient(mongo_uri)
    db = client[db_name]
    rdbms_meta_collection = os.getenv("MONGO_RDBMS_METADATA_COLLECTION")
    collection = db[rdbms_meta_collection]
    db_info = []
    for doc in collection.find():
        db_info.append(doc)
    return db_info

def load_db_schema(db_name, table_names: str) -> str:
    if db_name == 'polimap':
        db = load_polimap_postgres()
    elif db_name == 'elecdata':
        db = load_elecdata_postgres()
    else:
        raise ValueError(f"Invalid Database Name: {db_name}")
    table_names = [table_name.lower().strip() for table_name in table_names.split(',')]
    db_schema = db.get_table_info(table_names=table_names)
    if db_name == 'polimap':
        mongo_uri = os.environ.get("MONGO_URI")
        db_name = os.environ.get("MONGO_DB_NAME")
        client = MongoClient(mongo_uri)
        db = client[db_name]
        rdbms_meta_collection = os.getenv("MONGO_RDBMS_METADATA_COLLECTION")
        collection = db[rdbms_meta_collection]
        metadata = collection.find_one({"database": "polimap"})['Metadata']
        db_schema = metadata + '\n' + db_schema
    return db_schema

def web_search(query):
    search_tool = DuckDuckGoSearchRun()
    search_results = search_tool.run(query)
    return search_results

def clean_sql_query(sql_query: str) -> str:
    sql_query = sql_query.replace('`', '').strip()
    if sql_query.startswith('### Adjusted SQL Query:'):
        sql_query = sql_query[len('### Adjusted SQL Query:'):].strip()
    if sql_query.startswith('sql'):
        sql_query = sql_query[len('sql'):].strip()
    if 'SQLQuery:' in sql_query:
        sql_query = sql_query.split('SQLQuery:')[1].strip()
    return sql_query

class QuerySQLTool:
    def __init__(self, db: SQLDatabase):
        self.db = db
        self.query_runner = QuerySQLDataBaseTool(db=db)

    def _parse_decimal(self, match):
        value = match.group(1)
        return f"'{Decimal(value)}'"

    def _parse_datetime(self, match):
        date_args = list(map(int, match.group(1).split(',')))
        if 'tzinfo' in match.group(2):
            dt = datetime.datetime(*date_args, tzinfo=datetime.timezone.utc)
        else:
            dt = datetime.datetime(*date_args)
        return f"'{dt.isoformat()}'"
    
    def _custom_parser(self, res_str: str):
        # logger.info(f"Custom Parser raw: {res_str}")
        res_str = re.sub(
            r"Decimal\('([^']+)'\)"
            , self._parse_decimal
            , res_str
        )
        # logger.info(f"Custom Parser after decimal: {res_str}")
        res_str = re.sub(
            r"datetime\.datetime\(([\d, ]+)(, tzinfo=datetime\.timezone\.utc)?\)"
            , self._parse_datetime
            , res_str
        )
        # logger.info(f"Custom Parser after datetime1: {res_str}")
        res_str = re.sub(
            r"datetime\.datetime\(([\d, ]+)\)"
            , lambda m: f"'{datetime.datetime(*map(int, m.group(1).split(','))).isoformat()}'"
            , res_str
        )
        # logger.info(f"Custom Parser after datetime2: {res_str}")
        return ast.literal_eval(res_str)
        
    def execute_query(self, query: str) -> pd.DataFrame:
        # logger.info(f"Executing query: {query}")
        query = query.lower().strip()
        if query == "invalid user query - not related to the database.":
            raise InvalidUserQueryException()
        elif "create " in query or "delete " in query or "update " in query or "alter " in query:
            raise DDLCommandException()
        try:
            res = self.query_runner.invoke(query)
            if res == '':
                raise NoDataFoundException()
            res = self._custom_parser(res)
            columns = self.get_cols(query)
            if columns == []: columns = range(len(res[0]))
            res = pd.DataFrame.from_records(data=res, columns=columns)
            return res
        except Exception as e:
            raise e

    def get_cols(self, sql_query: str) -> list:
        select_regex = re.compile(r'select\s+(.+?)\s+from', re.IGNORECASE | re.DOTALL)
        all_matches = select_regex.findall(sql_query)
        if not all_matches: return []
        final_select = all_matches[-1]
        columns = [col.lower().strip().split(' as ')[-1].split('.')[-1] for col in final_select.split(',')]
        return columns

class ChatHistory:
    """
    ChatHistory Class
    
    This class manages chat history for users, storing and retrieving data from a MongoDB database.
    
    MongoDB Database Structure:
    - Database: ChatHistoryDB
    - Collection: <user_id> (Each user has a dedicated collection named after their user_id)
    - Document Structure:
      {
        "chat_id": <str>,             # Unique identifier for the chat session
        "date": <str>,                # Date the chat was created (YYYY-MM-DD format)
        "title": <str>,               # Short title for the chat (first 30 characters of the first message)
        "pinned": <bool>,             # Indicates if the chat is pinned
        "archived": <bool>,           # Indicates if the chat is archived
        "last_updated": <datetime>,   # Timestamp of the last update to the chat
        "messages": [                 # Array of message objects
          {
            "messageID": <str>,       # Unique identifier for the message
            "user": <str>,            # "user" or "bot" to indicate the sender
            "content": <str>,         # The message content
            "date": <str>,            # Date the message was sent (YYYY-MM-DD format)
            "time": <str>             # Time the message was sent (HH:MM:SS format)
          },
          ...
        ],
        "documents": [                # Array of document objects
          {
            "doc_id": <str>,          # Unique identifier for the document
            "filename": <str>,        # Original filename of the uploaded document
            "file_type": <str>,       # File type (e.g., "csv" or "pdf")
            "upload_date": <datetime> # Date and time the document was uploaded
          },
          ...
        ]
      }
    
    Key Features:
    - Each user's chat history is stored in a separate collection, identified by `user_id`.
    - Each chat session is represented by a document, identified by `chat_id`.
    - The `messages` field in the document contains an array of chat messages.
    - The `documents` field contains metadata about uploaded documents.
    - Actual document files are stored in GridFS.
    - Supports operations like adding messages, retrieving chat history, pinning/unpinning chats,
      archiving chats, searching through chat history, uploading documents, and retrieving documents.
    """

    def __init__(self, user_id="default_user", chat_id=None):
        mongo_uri = os.environ.get("MONGO_URI")
        db_name = os.environ.get("MONGO_DB_NAME")

        self.user_id = user_id
        self.chat_id = chat_id
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db[str(self.user_id)]
        self.fs = gridfs.GridFS(self.db)
        self._ensure_text_index()

    def _ensure_text_index(self):
        indexes = self.collection.list_indexes()
        index_names = [index['name'] for index in indexes]

        index_name = "messages_content_text_index"
        fields_to_index = [("messages.content", TEXT)]

        if index_name not in index_names:
            self.collection.create_index(fields_to_index, name=index_name)

    def _convert_objectid(self, data):
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, ObjectId):
                    data[key] = str(value)
                elif isinstance(value, list):
                    data[key] = [self._convert_objectid(item) for item in value]
                elif isinstance(value, dict):
                    data[key] = self._convert_objectid(value)
        return data
    
    def _check_document_readability(self, file_content: bytes, file_type: str) -> Tuple[bool, str]:
        if file_type == 'csv':
            try:
                content = io.BytesIO(file_content)
                df = pd.read_csv(content)

                if df.empty:
                    return False, "The CSV file is empty or contains no readable text."
            except Exception as e:
                return False, f"Error reading CSV with pandas: {str(e)}"

        elif file_type == 'pdf':
            try:
                reader = PdfReader(io.BytesIO(file_content))
                text_content = ""
                for page in reader.pages:
                    text_content += page.extract_text() or ""
                if not text_content.strip():
                    return False, "The PDF file is empty or contains no readable text."
            except Exception as e:
                return False, f"Error reading PDF: {str(e)}"
        else:
            return False, "Unsupported file type."

        return True, "Document is readable and valid."
    
    def _get_docs(self, chat_id):
        chat = self.collection.find_one({"chat_id": chat_id}, {"documents": 1})
        return chat.get("documents", []) if chat else []

    def _get_doc_content(self, doc_id):
        try:
            file = self.fs.get(ObjectId(doc_id))
            content = file.read()
            filename = file.filename
            return filename, content
        except gridfs.errors.NoFile:
            return None, None

    def _prepare_docs_for_llm(self, chat_id):
        docs = self._get_docs(chat_id)
        formatted_docs = []

        for doc in docs:
            filename, content = self._get_doc_content(doc['doc_id'])
            if filename and content:
                if doc['file_type'] == 'csv':
                    try:
                        csv_content = io.BytesIO(content)
                        df = pd.read_csv(csv_content)
                        text_content = df.to_string(index=False)
                    except Exception as e:
                        raise ValueError(f"Error reading CSV file: {str(e)}")
                
                elif doc['file_type'] == 'pdf':
                    try:
                        reader = PdfReader(io.BytesIO(content))
                        text_content = ""
                        for page in reader.pages:
                            text_content += page.extract_text() or ""
                        if not text_content.strip():
                            raise ValueError("The PDF file is empty or contains no readable text.")
                    except Exception as e:
                        raise ValueError(f"Error reading PDF file: {str(e)}")
                
                else:
                    raise ValueError(f"Unsupported file type: {doc['file_type']}")

                formatted_docs.append(f"Document: {filename}\nContent: {text_content}\n")

        return "\n".join(formatted_docs)
    
    def _count_tokens(self, text: str) -> int:
        return len(tiktoken.get_encoding('cl100k_base').encode(text))

    def get_all_chats(self):
        chats = self.collection.find({}, {"messages": 0})
        return [self._convert_objectid(chat) for chat in chats]

    def get_messages(self, chat_id):
        chat = self.collection.find_one({"chat_id": chat_id}, {"messages": 1})
        return chat["messages"] if chat else []
    
    def get_recent_messages(self, chat_id):
        token_limit = int(os.environ.get("TOKEN_LIMIT", 4096))
        chat = self.collection.find_one({"chat_id": chat_id})
        
        if chat and "messages" in chat:
            messages = chat["messages"]
            recent_messages = []
            total_tokens = 0

            for message in reversed(messages):
                message_text = message["content"]
                message_tokens = self._count_tokens(message_text)

                if total_tokens + message_tokens > token_limit:
                    break
                
                recent_messages.append(message)
                total_tokens += message_tokens

            return list(reversed(recent_messages))
        
        return []
    
    def get_documents_context(self, chat_id):
        return self._prepare_docs_for_llm(chat_id)

    def add_message(self, chat_id, content, is_user=True):
        if not chat_id:
            chat_id = str(ObjectId())
        
        message = {
            "messageID": str(ObjectId()),
            "user": "user" if is_user else "bot",
            "content": content,
            "date": datetime.datetime.now().strftime("%Y-%m-%d"),
            "time": datetime.datetime.now().strftime("%H:%M:%S")
        }
        
        self.collection.update_one(
            {"chat_id": chat_id},
            {
                "$push": {"messages": message},
                "$setOnInsert": {
                    "date": datetime.datetime.now().strftime("%Y-%m-%d"),
                    "title": content[:30],
                    "pinned": False,
                    "archived": False
                },
                "$set": {"last_updated": datetime.datetime.now()}
            },
            upsert=True
        )
        return chat_id
    
    def upload_doc(self, chat_id, file, filename, file_type):

        if file_type not in ["csv", "pdf"]:
            raise ValueError("Unsupported file type. Only CSV and PDF are allowed.")
        
        is_readable, message = self._check_document_readability(file, file_type)
        if not is_readable:
            raise ValueError(message)
        
        file_id = self.fs.put(file, filename=filename, content_type=f"application/{file_type}")

        doc_info = {
            "doc_id": str(file_id),
            "filename": filename,
            "file_type": file_type,
            "upload_date": datetime.datetime.now()
        }

        self.collection.update_one(
            {"chat_id": chat_id},
            {
                "$push": {"documents": doc_info},
                "$set": {"last_updated": datetime.datetime.now()}
            },
            upsert=True
        )

        return str(file_id)
    
    def delete_chat(self, chat_id):
        self.collection.delete_one({"chat_id": chat_id})

    def archive_chat(self, chat_id):
        self.collection.update_one(
            {"chat_id": chat_id},
            {"$set": {"archived": True}}
        )
    
    def unarchive_chat(self, chat_id):
        self.collection.update_one(
            {"chat_id": chat_id},
            {"$set": {"archived": False}}
        )

    def pin_chat(self, chat_id):
        self.collection.update_one(
            {"chat_id": chat_id},
            {"$set": {"pinned": True}}
        )

    def unpin_chat(self, chat_id):
        self.collection.update_one(
            {"chat_id": chat_id},
            {"$set": {"pinned": False}}
        )

    def search_chats(self, term):
        results = list(self.collection.find(
            {"$text": {"$search": term}},
            {"score": {"$meta": "textScore"}, "messages": 0}
        ).sort([("score", {"$meta": "textScore"})]))
        
        return [self._convert_objectid(result) for result in results]