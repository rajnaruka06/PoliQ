##Workflows.py

from AI_Stuff.Agent_Helpers import load_elecdata_postgres, clean_sql_query, SQLCoder, DDLCommandException, ChatHistory
from AI_Stuff.CustomAgents import SQLExpert, ResponseSummarizer
from langchain_community.chat_models import ChatOpenAI
import os
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
env_path = os.path.join(os.path.dirname(__file__), '.ENV')
load_dotenv(dotenv_path=env_path)

class elecdataworkflow:
    def __init__(self):
        self.db = load_elecdata_postgres()
        self.dialect = self.db.dialect
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0,
            max_tokens=None,
            timeout=None,
            max_retries=2
        )
        self.schema_info = self.db.get_table_info()
        self.sql_coder_agent = SQLExpert(llm = self.llm)
        self.sql_query_tool = SQLCoder(db=self.db)
        self.response_summarizer_agent = ResponseSummarizer(llm=self.llm)
        self.history = ChatHistory()

    def _generate_query(self, user_query: str) -> str:
        sql_query = self.sql_coder_agent.generate_query(
            user_query = user_query
            , dialect=self.dialect
            , table_info=self.schema_info
            , chat_history=self.history.get()
        )
        sql_query = clean_sql_query(sql_query)
        return sql_query
    
    def _execute_sql_query(self, sql_query):
        if "CREATE" in sql_query or "DELETE" in sql_query or "UPDATE" in sql_query or "ALTER" in sql_query:
            raise DDLCommandException
        data = self.sql_query_tool.execute_query(sql_query)
        return data
    
    def run(self, user_query: str) -> str:
        sql_query = self._generate_query(user_query)
        # logger.info(f"Generated SQL Query: {sql_query}")
        if sql_query == "Invalid User Query - Not related to the Database":
            return sql_query
        try:
            data = self._execute_sql_query(sql_query)
            # logger.info(f"Data fetched: {data}")
            response = self.response_summarizer_agent.summarize(user_query=user_query, dataframe=data)
            # logger.info(f"Response: {response}")
            chat = f"""User Query: {user_query}\nResponse: {response}"""
            self.history.add(chat)
            return response
        except Exception as e:
            return str(e)