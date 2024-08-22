##Workflows.py

from AI_Stuff.Agent_Helpers import load_elecdata_postgres, clean_sql_query, SQLCoder, DDLCommandException
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

    def _generate_query(self, user_query: str, chat_history: str = '') -> str:
        sql_query = self.sql_coder_agent.generate_query(
            user_query = user_query
            , dialect=self.dialect
            , table_info=self.schema_info
            , chat_history=chat_history
        )
        sql_query = clean_sql_query(sql_query)
        return sql_query
    
    def _execute_sql_query(self, sql_query):
        if "CREATE" in sql_query or "DELETE" in sql_query or "UPDATE" in sql_query or "ALTER" in sql_query:
            raise DDLCommandException
        data = self.sql_query_tool.execute_query(sql_query)
        return data
    
    def run(self, user_query: str, chat_history: str = '') -> str:
        sql_query = self._generate_query(user_query, chat_history)
        if sql_query == "Invalid User Query - Not related to the Database":
            return sql_query
        try:
            data = self._execute_sql_query(sql_query)
            response = self.response_summarizer_agent.summarize(user_query=user_query, dataframe=data)
            return response
        except Exception as e:
            return f"Please try again, an error occured: {str(e)}"