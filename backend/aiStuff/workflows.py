## workflows.py

from .agentHelpers import (
    loadPostgresDatabase
    , cleanSqlQuery
    , cleanSummaryResponse
    , QuerySQLTool
    , InvalidUserQueryException
    , NoDataFoundException
    , loadLLM
    , loadFromMongo
    , cleanWhereConditions
)
from .customAgents import SqlExpert, ResponseSummarizer, RouterAgent, ChatAgent, DatasetRegionMatcherAgent
import sys
import os
import re
from typing import Dict, List, Any
from dotenv import load_dotenv
import logging
from langchain.base_language import BaseLanguageModel
import json

sys.path.append(os.path.dirname(__file__))
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

recourcesPath = os.path.join(os.path.dirname(__file__), '../resources')
envPath = os.path.join(recourcesPath, '.ENV')
load_dotenv(dotenv_path=envPath)

class ElecDataWorkflow:
    """
    This class handles electoral data queries.

    Attributes:
        dbName (str): The name of the database containing electoral data.
        llm: The large language model used for generating queries and summaries.
        sqlCoderAgent (SqlExpert): The agent responsible for generating and refining SQL queries.
        sqlQueryTool (QuerySQLTool): The tool used for executing SQL queries.
        responseSummarizerAgent (ResponseSummarizer): The agent responsible for summarizing the results of SQL queries.
    """    
    def __init__(self):
        self.dbName = os.getenv("ELECDATA_DB_NAME")
        self.llm = loadLLM()
        self.routerAgent = RouterAgent(llm=self.llm)
        self.chatAgent = ChatAgent(llm=self.llm)
        self.sqlCoderAgent = SqlExpert(llm=self.llm)
        self.sqlQueryTool = QuerySQLTool(dbName=self.dbName)
        self.responseSummarizerAgent = ResponseSummarizer(llm=self.llm)
        self.tableInfo = None
        self.dialect = None
        self._setTableInfo()
        self._setDialect()

    def _setTableInfo(self):
        with loadPostgresDatabase(self.dbName) as db:
            self.tableInfo = db.get_table_info()
    
    def _setDialect(self):
        with loadPostgresDatabase(self.dbName) as db:
            self.dialect = db.dialect

    def _generateQuery(self, userQuery: str, chatHistory: str = '') -> str:
        
        try:
            sqlQuery = self.sqlCoderAgent.generateAndRefineQuery(
                userQuery=userQuery,
                dialect=self.dialect,
                tableInfo=self.tableInfo,
                chatHistory=chatHistory
            )
            sqlQuery = cleanSqlQuery(sqlQuery)
            return sqlQuery
        except Exception as e:
            logger.exception(f"Error generating SQL query: {str(e)}")
            raise

    def _executeSqlQuery(self, sqlQuery):
        try:
            data = self.sqlQueryTool.executeQuery(sqlQuery)
            return data
        except Exception as e:
            logger.exception(f"Error executing SQL query: {str(e)}")
            raise

    def processUserQuery(self, userQuery: str, chatHistory: str = '') -> str:
        """
        Process user's query --> generate a SQL query, execute it, and summarize the results.

        Args:
            userQuery (str): The user's query.
            chatHistory (str, optional): The chat history. Defaults to an empty string.

        Returns:
            str: The summary of the results.

        Raises:
            InvalidUserQueryException: If the user's query is invalid.
            NoDataFoundException: If no data is found for the user's query.
            Exception: If an error occurs while processing the user's query.
        """
        try:
            queryType = self.routerAgent.determineQueryType(userQuery, chatHistory)
            if queryType.strip().upper() == "DATABASE":
                sqlQuery = self._generateQuery(userQuery, chatHistory)
                logger.info(f"Generated SQL Query: {sqlQuery}")

                whereColumns = self.sqlCoderAgent.extractWhereColumns(sqlQuery)
                whereColumns = cleanWhereConditions(whereColumns)
                logger.info(f"Extracted WHERE columns: {whereColumns}")
                context = ""
                for column in whereColumns:
                    selectQuery = f"SELECT DISTINCT {column['column']} FROM {column['table']};"
                    result = self.sqlQueryTool.executeQuery(selectQuery)
                    result = result.to_string()
                    context += f"{selectQuery}\n{result}\n\n"
                
                logger.info(f"Context: {context}")
                updatedQuery = self.sqlCoderAgent.updateWhereConditions(sqlQuery, userQuery, context)
                updatedQuery = cleanSqlQuery(updatedQuery)
                logger.info(f"Updated SQL Query: {updatedQuery}")

                data = self._executeSqlQuery(updatedQuery)
                response = self.responseSummarizerAgent.generateSummaryWithReflection(response=data.to_string(), userQuery=userQuery)
                response = cleanSummaryResponse(response)
            elif queryType.strip().upper() == "CHAT":
                response = self.chatAgent.generateResponse(userQuery, chatHistory)
            else:
                logger.exception(f"Invalid query type determined: {queryType}")
                return f"Error determining query type: {queryType}, Please try again."
            return response
        except InvalidUserQueryException as e:
            logger.exception(f"Invalid user query: {str(e)}")
            return str(e)
        except NoDataFoundException as e:
            logger.exception(f"No data found: {str(e)}")
            return str(e)
        except Exception as e:
            logger.exception(f"An error occurred: {str(e)}")
            return f"An error occurred: {str(e)}"

class DatasetRegionMatcher:
    def __init__(self):
        self.llm = loadLLM()
        self.datasetsMetadata = loadFromMongo('metadata', 'Datasets')
        self.regionsMetadata = loadFromMongo('metadata', 'Regions')
        self.agent = DatasetRegionMatcherAgent(llm = self.llm)

    def match(self, userQuery):
        return self.agent.match(
            userQuery,
            self.regionsMetadata,
            self.datasetsMetadata
        )
    
    