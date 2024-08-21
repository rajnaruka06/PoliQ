## Agent_Helpers.py

from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_community.utilities import SQLDatabase
import os
from dotenv import load_dotenv
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import ast
import re
from collections import deque
from decimal import Decimal
import datetime
import json

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

    def execute_query(self, query: str) -> pd.DataFrame:
        ## IF gets too complex, use eval instead, import datetime and decimal.Decimal
        try:
            res = self.query_runner.invoke(query)
            # res = res.replace('Decimal', '')
            if res == '':
                raise NoDataFoundException
            # res = ast.literal_eval(res)
            ## Not safe
            res = eval(res) ## Has to be updated 
            columns = self.get_cols(query)
            if columns == []: columns = range(len(res[0]))
            res = pd.DataFrame.from_records(data=res, columns=columns)
            return res
        except Exception as e:
            raise e

    def get_cols(self, sql_query: str) -> list:
        select_regex = re.compile(r'SELECT\s+(.+?)\s+FROM', re.IGNORECASE | re.DOTALL)
        all_matches = select_regex.findall(sql_query)
        if not all_matches: return []
        final_select = all_matches[-1]
        columns = [col.lower().strip().split(' as ')[-1].split('.')[-1] for col in final_select.split(',')]
        return columns

class ChatHistory:
    def __init__(self, lim = 3, user_id = 1, chat_id = 1, base_dir = 'ChatHistory'):
        self.lim = lim
        self.user_id = user_id
        self.chat_id = chat_id
        self.chat_history_dir = os.path.join(base_dir, str(self.user_id))
        self.chat_history_file = os.path.join(self.chat_history_dir, f"{self.chat_id}.json")
        self._init_chat_history()

    def _init_chat_history(self):
        os.makedirs(self.chat_history_dir, exist_ok=True)
        if os.path.exists(self.chat_history_file):
            self.chat_history = deque(self._load_chat_history(), maxlen=self.lim)
        else:
            self.chat_history = deque([], maxlen=self.lim)

    def _load_chat_history(self):
        with open(self.chat_history_file, 'r') as f:
            return json.load(f)

    def _save_chat_history(self):
        with open(self.chat_history_file, 'w') as f:
            json.dump(list(self.chat_history), f)

    def add(self, chat):
        self.chat_history.append(chat)
        self._save_chat_history()

    def get(self):
        return '\n---\n'.join(self.chat_history)