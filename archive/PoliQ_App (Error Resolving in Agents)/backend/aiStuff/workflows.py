## workflows.py

from .agentHelpers import (
    loadPostgresDatabase
    , cleanSqlQuery
    , cleanSummaryResponse
    , QuerySQLTool
    , InvalidUserQueryException
    , NoDataFoundException
    , loadLLM
)
from .customAgents import SqlExpert, ResponseSummarizer, RouterAgent, ChatAgent, SqlExpert2
import sys
import os
import re
from typing import Dict, List, Any
from dotenv import load_dotenv
import logging
from langchain.base_language import BaseLanguageModel

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
                data = self._executeSqlQuery(sqlQuery)
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

class ElecDataWorkflow2:
    """
    This class handles electoral data queries using a more advanced SQL generation approach.

    Attributes:
        dbName (str): The name of the database containing electoral data.
        llm: The large language model used for generating queries and summaries.
        routerAgent (RouterAgent): The agent responsible for determining the type of query.
        chatAgent (ChatAgent): The agent responsible for generating chat responses.
        sqlExpert (SqlExpert2): The agent responsible for generating and refining SQL queries.
        sqlQueryTool (QuerySQLTool): The tool used for executing SQL queries.
        responseSummarizerAgent (ResponseSummarizer): The agent responsible for summarizing the results of SQL queries.
    """
    
    def __init__(self, dbName: str = os.getenv("ELECDATA_DB_NAME")):
        logger.info("Initializing ElecDataWorkflow2")
        self.llm = loadLLM()
        self.dbName = dbName
        self.routerAgent = RouterAgent(llm=self.llm)
        self.chatAgent = ChatAgent(llm=self.llm)
        self.sqlExpert = SqlExpert2(llm=self.llm)
        self.sqlQueryTool = QuerySQLTool(dbName=self.dbName)
        self.responseSummarizerAgent = ResponseSummarizer(llm=self.llm)
        self.tableInfo = None
        self.dialect = None
        self._setTableInfo()
        self._setDialect()
        self.MAX_RETRIES = 3
        logger.info("ElecDataWorkflow2 initialized successfully")

    def _setTableInfo(self):
        logger.info("Setting table info")
        with loadPostgresDatabase(self.dbName) as db:
            self.tableInfo = db.get_table_info()
        logger.info("Table info set successfully")
    
    def _setDialect(self):
        logger.info("Setting dialect")
        with loadPostgresDatabase(self.dbName) as db:
            self.dialect = db.dialect
        logger.info(f"Dialect set to: {self.dialect}")

    def _executeQueryWithRetry(self, queryFunc, *args, **kwargs):
        logger.info(f"Executing query with retry. Max retries: {self.MAX_RETRIES}")
        for attempt in range(self.MAX_RETRIES):
            try:
                query = queryFunc(*args, **kwargs)
                query = cleanSqlQuery(query)
                logger.info(f"Attempt {attempt + 1}: Executing query: {query}")
                result = self.sqlQueryTool.executeQuery(query)
                logger.info("Query executed successfully")
                return result
            except Exception as e:
                logger.exception(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt == self.MAX_RETRIES - 1:
                    logger.exception("Max retries reached. Raising exception.")
                    raise
                kwargs['error_feedback'] = str(e)
        
        logger.exception(f"Failed to execute query after {self.MAX_RETRIES} attempts")
        raise Exception(f"Failed to execute query after {self.MAX_RETRIES} attempts")

    def _generateAndExecuteQuery(self, userQuery: str) -> Dict[str, Any]:
        logger.info("Generating and executing query")
        potentialTables = self.sqlExpert.selectPotentialTables(userQuery, self.tableInfo)
        logger.info(f"Potential tables selected: {potentialTables}")
        joinConditions = self.sqlExpert.determineJoinConditions(potentialTables, self.tableInfo)
        logger.info(f"Join conditions determined: {joinConditions}")
        filteringColumns = self.sqlExpert.selectFilteringColumns(potentialTables, userQuery, self.tableInfo)
        logger.info(f"Filtering columns selected: {filteringColumns}")
        
        logger.info("Executing distinct query")
        distinctQueryResult = self._executeQueryWithRetry(
            self.sqlExpert.generateDistinctQuery,
            potentialTables,
            joinConditions,
            filteringColumns,
            self.tableInfo
        )
        
        filterValues = self.sqlExpert.determineFilterValues(distinctQueryResult, userQuery)
        logger.info(f"Filter values determined: {filterValues}")
        
        finalQuery = self.sqlExpert.generateFinalQuery(
            potentialTables,
            joinConditions,
            filteringColumns,
            filterValues,
            userQuery,
            self.tableInfo
        )
        logger.info("Final query generated")
        
        finalQuery = self.sqlExpert.applyCRAG(finalQuery, self.tableInfo, userQuery)
        logger.info("CRAG applied to final query")
        
        logger.info("Executing final query")
        finalQueryResult = self.sqlQueryTool.executeQuery(finalQuery)
        logger.info("Final query executed successfully")
        
        return {
            "query": finalQuery,
            "result": finalQueryResult
        }

    def processUserQuery(self, userQuery: str, chatHistory: str = '') -> str:
        logger.info(f"Processing user query: {userQuery}")
        try:
            queryType = self.routerAgent.determineQueryType(userQuery, chatHistory)
            logger.info(f"Query type determined: {queryType}")
            
            if queryType.strip().upper() == "DATABASE":
                queryData = self._generateAndExecuteQuery(userQuery)
                logger.info("Generating summary with reflection")
                response = self.responseSummarizerAgent.generateSummaryWithReflection(
                    response=queryData["result"].to_string(),
                    userQuery=userQuery
                )
                response = cleanSummaryResponse(response)
                logger.info("Summary generated and cleaned")
            elif queryType.strip().upper() == "CHAT":
                logger.info("Generating chat response")
                response = self.chatAgent.generateResponse(userQuery, chatHistory)
            else:
                logger.exception(f"Invalid query type determined: {queryType}")
                return f"Error determining query type: {queryType}, Please try again."
            
            logger.info("User query processed successfully")
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

## Under Development
# class PolimapWorkflow:
#     """
#     This class handles polimap data queries.

#     Attributes:
#         dbName (str): The name of the database containing polimap data.
#         llm: The large language model used for generating queries and summaries.
#         tableSelector (TableSelector): The agent responsible for selecting appropriate tables.
#         sqlCoderAgent (SqlExpert): The agent responsible for generating and refining SQL queries.
#         sqlQueryTool (QuerySQLTool): The tool used for executing SQL queries.
#         responseSummarizerAgent (ResponseSummarizer): The agent responsible for summarizing the results of SQL queries.
#     """    
#     def __init__(self):
#         self.dbName = os.getenv("POLIMAP_DB_NAME")
#         self.llm = loadLLM(llmName='claude', model='claude-3-opus-20240229')
#         self.routerAgent = RouterAgent(llm=self.llm)
#         self.chatAgent = ChatAgent(llm=self.llm)
#         self.tableSelector = PolimapTableSelector(llm=self.llm)
#         self.sqlCoderAgent = SqlExpert(llm=self.llm)
#         self.sqlQueryTool = QuerySQLTool(dbName=self.dbName)
#         self.responseSummarizerAgent = ResponseSummarizer(llm=self.llm)
#         self.dialect = None
#         self._setDialect()

#     def _setDialect(self):
#         with loadPostgresDatabase(self.dbName) as db:
#             self.dialect = db.dialect

#     def _selectTables(self, userQuery: str) -> str:
#         polimapPrompt = loadPolimapPrompt(polimapPromptPath)
#         selectedTables = self.tableSelector.selectTables(userQuery, polimapPrompt)
#         return selectedTables

#     def _getTableInfo(self, selectedTables: str) -> str:
#         tableList = [table.strip() for table in selectedTables.split(',')]
#         with loadPostgresDatabase(self.dbName) as db:
#             return db.get_table_info(tableList)

#     def _extractColumnMappings(self, tableInfo: str) -> Dict[str, Dict[str, str]]:
#         """
#         Extracts column name mappings from SQL CREATE TABLE statements.
        
#         Args:
#             tableInfo (str): A string containing multiple SQL CREATE TABLE statements.
        
#         Returns:
#             Dict[str, Dict[str, str]]: A dictionary with table names as keys and dictionaries of column mappings as values.
#         """
#         create_table_regex = re.compile(r'CREATE TABLE (\w+)\s*\((.*?)\)', re.DOTALL | re.IGNORECASE)
#         column_regex = re.compile(r'"([^"]+)"[^,\n]+(?:,|$)', re.IGNORECASE)
        
#         result = {}
        
#         for match in create_table_regex.finditer(tableInfo):
#             table_name = match.group(1)
#             column_defs = match.group(2)
            
#             columns = {}
#             for column_match in column_regex.finditer(column_defs):
#                 column_name = column_match.group(1)
#                 if column_name and not column_name.upper().startswith('CONSTRAINT'):
#                     columns[column_name.lower()] = column_name
            
#             result[table_name] = columns
        
#         return result

#     def _replaceColumnNames(self, sqlQuery: str, colMappings: Dict[str, Dict[str, str]]) -> str:
#         """
#         Replace lowercase column names in the SQL query with their original names.
        
#         Args:
#             sqlQuery (str): The SQL query to process.
#             colMappings (Dict[str, Dict[str, str]]): A dictionary of table names to column mappings.
        
#         Returns:
#             str: The SQL query with column names replaced.
#         """
#         allColumns = {}
#         for tableColumns in colMappings.values():
#             allColumns.update(tableColumns)
        
#         sortedColumns = sorted(allColumns.keys(), key=len, reverse=True)
        
#         for colLower in sortedColumns:
#             colOriginal = allColumns[colLower]
#             sqlQuery = re.sub(r'\b' + re.escape(colLower) + r'\b', colOriginal, sqlQuery, flags=re.IGNORECASE)
        
#         return sqlQuery

#     def _generateQuery(self, userQuery: str, tableInfo: str, chatHistory: str = '') -> str:
#         try:
#             sqlQuery = self.sqlCoderAgent.generateAndRefineQuery(
#                 userQuery=userQuery,
#                 dialect=self.dialect,
#                 tableInfo=tableInfo,
#                 chatHistory=chatHistory
#             )
#             sqlQuery = cleanSqlQuery(sqlQuery)
            
#             # Extract column mappings and replace column names
#             columnMappings = self._extractColumnMappings(tableInfo)
#             sqlQuery = self._replaceColumnNames(sqlQuery, columnMappings)
            
#             return sqlQuery
#         except Exception as e:
#             logger.exception(f"Error generating SQL query: {str(e)}")
#             raise

#     def _executeSqlQuery(self, sqlQuery):
#         try:
#             data = self.sqlQueryTool.executeQuery(sqlQuery)
#             return data
#         except Exception as e:
#             logger.exception(f"Error executing SQL query: {str(e)}")
#             raise

#     def processUserQuery(self, userQuery: str, chatHistory: str = '') -> str:
#         """
#         Process user's query --> select appropriate tables, generate a SQL query, execute it, and summarize the results.

#         Args:
#             userQuery (str): The user's query.
#             chatHistory (str, optional): The chat history. Defaults to an empty string.

#         Returns:
#             str: The summary of the results.

#         Raises:
#             InvalidUserQueryException: If the user's query is invalid.
#             NoDataFoundException: If no data is found for the user's query.
#             Exception: If an error occurs while processing the user's query.
#         """
#         try:
#             queryType = self.routerAgent.determineQueryType(userQuery, chatHistory)
#             if queryType.strip().upper() == "DATABASE":
#                 selectedTables = self._selectTables(userQuery)
#                 tableInfo = self._getTableInfo(selectedTables)
#                 sqlQuery = self._generateQuery(userQuery, tableInfo, chatHistory)
#                 data = self._executeSqlQuery(sqlQuery)
#                 response = self.responseSummarizerAgent.generateSummaryWithReflection(response=data.to_string(), userQuery=userQuery)
#                 response = cleanSummaryResponse(response)
#             elif queryType.strip().upper() == "CHAT":
#                 response = self.chatAgent.generateResponse(userQuery, chatHistory)
#             else:
#                 logger.exception(f"Invalid query type determined: {queryType}")
#                 return f"Error determining query type: {queryType}, Please try again."
#             return response
#         except InvalidUserQueryException as e:
#             logger.exception(f"Invalid user query: {str(e)}")
#             return str(e)
#         except NoDataFoundException as e:
#             logger.exception(f"No data found: {str(e)}")
#             return str(e)
#         except Exception as e:
#             logger.exception(f"An error occurred: {str(e)}")
#             return f"An error occurred: {str(e)}"
