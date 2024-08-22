## Agent_Helpers.py

from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_community.utilities import SQLDatabase
import os
from dotenv import load_dotenv
import pandas as pd
import re
import ast
from decimal import Decimal
import datetime
import json
from pymongo import MongoClient, TEXT
from bson import ObjectId

env_path = os.path.join(os.path.dirname(__file__), '.ENV')
load_dotenv(dotenv_path=env_path)

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

def clean_sql_query(sql_query: str) -> str:
    sql_query = sql_query.replace('`', '').strip()
    if sql_query.startswith('### Adjusted SQL Query:'):
        sql_query = sql_query[len('### Adjusted SQL Query:'):].strip()
    if sql_query.startswith('sql'):
        sql_query = sql_query[len('sql'):].strip()
    if 'SQLQuery:' in sql_query:
        sql_query = sql_query.split('SQLQuery:')[1].strip()
    return sql_query

class DDLCommandException(Exception):
    "Raised when SQL contains DDL commands (CREATE, DELETE, UPDATE, ALTER)"
    pass

class NoDataFoundException(Exception):
    "Raised when no data is fetched from the database"
    pass

class SchemaInfoBuilder:
    def __init__(self, datasets):
        self.datasets = datasets
        self.schema_info = ""

    def create_schema_info(self, output_path='schema_info.json'):
        for db_name, db in self.datasets.items():
            self.schema_info += f"Database: {db_name}:\n"
            for table in db.get_usable_table_names():
                ##  Update this later. Move Auth and Django tables elseware or use a json config file to exclude tables
                if db_name == 'elecdata' and not table.startswith('elecdata'): continue
                self.schema_info += db.get_table_info([table]) + "\n"

        self.schema_info = self._parse_schema_info()
        with open(output_path, 'w') as f:
            f.write(json.dumps(self.schema_info, indent=4))

    def _parse_schema_info(self) -> dict:
        databases = {}
        current_db = None
        current_table = None

        for line in self.schema_info.split('\n'):
            line = line.strip()

            if line.startswith('Database:'):
                current_db = line.split(':')[1].strip()
                databases[current_db] = {}
            elif line.startswith('CREATE TABLE'):
                table_name = line.split('CREATE TABLE')[1].split('(')[0].strip()
                current_table = table_name
                databases[current_db][current_table] = {
                    'columns': [],
                    'constraints': []
                }
            elif current_db and current_table:
                if line.startswith('CONSTRAINT'):
                    databases[current_db][current_table]['constraints'].append(line)
                elif '/*' in line:  # Sample data line
                    continue
                elif line and line != ')':
                    column_info = line.split(',')[0].strip()
                    column_name = column_info.split()[0]
                    column_type = ' '.join(column_info.split()[1:])
                    databases[current_db][current_table]['columns'].append({
                        'name': column_name,
                        'type': column_type
                    })

        return databases

class SQLCoder:
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
        res_str = re.sub(
            r"Decimal\('([^']+)'\)"
            , self._parse_decimal
            , res_str
        )
        res_str = re.sub(
            r"datetime\.datetime\(([\d, ]+)(, tzinfo=datetime\.timezone\.utc)?\)"
            , self._parse_datetime
            , res_str
        )
        res_str = re.sub(
            r"datetime\.datetime\(([\d, ]+)\)"
            , lambda m: f"'{datetime.datetime(*map(int, m.group(1).split(','))).isoformat()}'"
            , res_str
        )
        
        return ast.literal_eval(res_str)
        
    def execute_query(self, query: str) -> pd.DataFrame:
        try:
            res = self.query_runner.invoke(query)
            if res == '':
                raise NoDataFoundException
            res = self._custom_parser(res)
            columns = self.get_cols(query)
            if columns == []: columns = range(len(res[0]))
            res = pd.DataFrame.from_records(data=res, columns=columns)
            return res
        except Exception as e:
            raise e

    # def execute_query(self, query: str) -> pd.DataFrame:
    #     ## IF gets too complex, use eval instead, import datetime and decimal.Decimal
    #     try:
    #         res = self.query_runner.invoke(query)
    #         # res = res.replace('Decimal', '')
    #         if res == '':
    #             raise NoDataFoundException
    #         # res = ast.literal_eval(res)
    #         ## Not safe
    #         res = eval(res) ## Has to be updated 
    #         columns = self.get_cols(query)
    #         if columns == []: columns = range(len(res[0]))
    #         res = pd.DataFrame.from_records(data=res, columns=columns)
    #         return res
    #     except Exception as e:
    #         raise e


    def get_cols(self, sql_query: str) -> list:
        select_regex = re.compile(r'SELECT\s+(.+?)\s+FROM', re.IGNORECASE | re.DOTALL)
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
        ]
      }
    
    Key Features:
    - Each user's chat history is stored in a separate collection, identified by `user_id`.
    - Each chat session is represented by a document, identified by `chat_id`.
    - The `messages` field in the document contains an array of chat messages.
    - Supports operations like adding messages, retrieving chat history, pinning/unpinning chats,
      archiving chats, and searching through chat history.
    """

    def __init__(self, user_id="default_user", chat_id=None, mongo_uri="mongodb://localhost:27017/", db_name="ChatHistoryDB"):
        self.user_id = user_id
        self.chat_id = chat_id
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db[str(self.user_id)]
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

    def get_all_chats(self):
        chats = self.collection.find({}, {"messages": 0})
        # return list(chats)
        return [self._convert_objectid(chat) for chat in chats]

    def get_messages(self, chat_id):
        chat = self.collection.find_one({"chat_id": chat_id}, {"messages": 1})
        return chat["messages"] if chat else []

    def get_recent_messages(self, chat_id, limit=5):
        chat = self.collection.find_one({"chat_id": chat_id})
        if chat and "messages" in chat:
            return chat["messages"][-limit:]
        return []

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

    def delete_chat(self, chat_id):
        self.collection.delete_one({"chat_id": chat_id})

    def archive_chat(self, chat_id):
        self.collection.update_one(
            {"chat_id": chat_id},
            {"$set": {"archived": True}}
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