## CustomAgents.py

from typing import Dict, Any, Optional, List
from langchain_core.prompts import PromptTemplate
from langchain.base_language import BaseLanguageModel
import pandas as pd
import json
import os

resourcesPath = os.path.join(os.path.dirname(__file__), '../resources')
envPath = os.path.join(resourcesPath, '.ENV')

## Using CRAG for SQL Generation
class SqlExpert:
    def __init__(self, llm: BaseLanguageModel):
        self.llm = llm

    def generateAndRefineQuery(self, userQuery: str, dialect: str, tableInfo: str, chatHistory: str = '') -> str:
        template = """Given an input question, perform the following steps:

        1. Generate a syntactically correct {dialect} SQL query.
        2. Provide feedback on the generated query, suggesting improvements if necessary.
        3. Based on the feedback, provide a final, improved SQL query.

        Rules for SQL generation (MUST BE FOLLOWED FOR BOTH INITIAL AND FINAL QUERIES):
        - Only use tables and columns that are explicitly mentioned in the 'Available tables' section below.
        - Do not assume any table or columns that are not listed.
        - Do not include any INSERT, DROP, TRUNCATE, CREATE, DELETE, UPDATE, or ALTER statements.
        - Use Common Table Expressions (CTEs) for data manipulation instead of subqueries.
        - Never use * in the SELECT statement. Always specify the columns you want to retrieve.
        - Use GROUP BY instead of DISTINCT where applicable.
        - End the SQL query with a semicolon (;).
        - Do not include any LIMIT, OFFSET, WHERE clauses, or any other filters unless explicitly mentioned in the user query.

        Available tables:
        {tableInfo}

        Chat History: {chatHistory}
        User Query: {userQuery}

        Respond in the following format:

        1. INITIAL SQL QUERY:
        <Write only the SQL query here, nothing else>

        2. FEEDBACK:
        <Provide numbered list of feedback points>

        3. FINAL SQL QUERY:
        <Write only the final SQL query here, nothing else>

        IMPORTANT: Ensure that both the INITIAL SQL QUERY and FINAL SQL QUERY strictly adhere to all the rules mentioned above.
        Double-check that NO COLUMNS OR TABLES ARE USED THAT ARE NOT EXPLICITLY LISTED IN THE AVAILABLE TABLES SECTION.

        Each section should be separated by the delimiter: -----
        """

        response = self._invokeChain(template, userQuery=userQuery, dialect=dialect, tableInfo=tableInfo, chatHistory=chatHistory)
        return response

    def _invokeChain(self, template: str, **kwargs: Any) -> str:
        try:
            prompt = PromptTemplate.from_template(template)
            chain = prompt | self.llm
            return chain.invoke(kwargs).content.strip()
        except Exception as e:
            raise RuntimeError(f"Error invoking language model: {str(e)}")

## Using Self - Refelction
class ResponseSummarizer:
    def __init__(self, llm: BaseLanguageModel):
        self.llm = llm

    def generateSummaryWithReflection(self, response: str, userQuery: str) -> str:
        template = """Given a user query and a response, perform the following steps:

        1. Generate a concise summary of the response.
        2. Reflect on this summary and provide feedback for improvement.
        3. Taking the reflection feedback into account, update the summary.

        User Query: {userQuery}
        Response: {response}

        Respond in the following format:

        1. INITIAL SUMMARY:
        <Write only the summary here, nothing else>

        2. REFLECTION FEEDBACK:
        <Provide feedback for improving the summary>

        3. UPDATED SUMMARY:
        <Write only the updated summary here, nothing else>

        Each section should be separated by the delimiter: -----
        Do not add the delimiter at the end of the response it should be placed between the sections.
        """

        result = self._invokeLlm(template, response=response, userQuery=userQuery)
        return result

    def _invokeLlm(self, template: str, **kwargs: Any) -> str:
        try:
            prompt = PromptTemplate.from_template(template)
            chain = prompt | self.llm
            return chain.invoke(kwargs).content.strip()
        except Exception as e:
            raise RuntimeError(f"Error invoking language model: {str(e)}")

class ChatAgent:
    def __init__(self, llm: BaseLanguageModel):
        self.llm = llm

    def generateResponse(self, userQuery: str, chatHistory: str = '') -> str:
        template = """You are an AI assistant specializing in electoral data and general conversation.

        Chat History: {chatHistory}
        User Query: {userQuery}

        Provide a helpful and engaging response to the user's query. Do not assume any information. Only provide information from chat history.

        Response:
        """

        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm
        return chain.invoke({"userQuery": userQuery, "chatHistory": chatHistory}).content.strip()

class RouterAgent:
    def __init__(self, llm: BaseLanguageModel):
        self.llm = llm

    def determineQueryType(self, userQuery: str, chatHistory: str = '') -> str:
        template = """Determine whether the following user query requires a database query or a general conversation response. You have connection to a database with electoral data.

        Chat History: {chatHistory}
        User Query: {userQuery}

        Respond with either "DATABASE" if the query requires electoral data from a database, or "CHAT" if it's a general conversation or question that doesn't require specific database access.
        Your response should just be the word "DATABASE" or "CHAT".

        Query Type:
        """

        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm
        return chain.invoke({"userQuery": userQuery, "chatHistory": chatHistory}).content.strip()

class SqlExpert2:
    def __init__(self, llm: BaseLanguageModel):
        self.llm = llm

    def selectPotentialTables(self, userQuery: str, tableInfo: str) -> List[str]:
        template = """
        Given the following user query and available tables, select the most relevant tables that might be needed to answer the query.
        
        User Query: {userQuery}
        
        Available Tables:
        {tableInfo}
        
        Return a comma-separated list of table names, without any additional explanation.
        """
        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm
        result = chain.invoke({"userQuery": userQuery, "tableInfo": tableInfo})
        return [table.strip() for table in result.content.split(',')]

    def determineJoinConditions(self, tables: List[str], tableInfo: str) -> Dict[str, str]:
        template = """
        Given the following target tables, determine the appropriate join conditions between them. (JOIN ONLY AMONGST TARGET TABLES)
        
        Target Tables: {tables}
        
        Table Information:
        {tableInfo}
        
        Return a JSON object where the keys are pairs of table names (e.g., "table1__table2") and the values are the join conditions.
        Just return a json object that can be loaded into json directly and nothing else.
        """
        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm
        result = chain.invoke({"tables": ', '.join(tables), "tableInfo": tableInfo}).content
        result = result.replace('`', '').replace('json', '')
        return json.loads(result)

    def selectFilteringColumns(self, tables: List[str], userQuery: str, tableInfo: str) -> List[str]:
        template = """
        Given the following user query and selected tables, determine which columns should be used for filtering the results.
        
        User Query: {userQuery}
        Selected Tables: {tables}
        
        Table Information:
        {tableInfo}
        
        Return a comma-separated list of column names (including table names, e.g., "table.column"), without any additional explanation.
        """
        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm
        result = chain.invoke({"userQuery": userQuery, "tables": ', '.join(tables), "tableInfo": tableInfo})
        return [col.strip() for col in result.content.split(',')]

    def generateDistinctQuery(self, tables: List[str], joinConditions: Dict[str, str], filteringColumns: List[str], tableInfo: str, error_feedback: str = "") -> str:
        template = """
        Generate a SQL query to select distinct values from the specified columns and tables.
        Use the provided join conditions to connect the tables.
        
        Tables: {tables}
        Join Conditions: {joinConditions}
        Filtering Columns: {filteringColumns}
        
        Table Information:
        {tableInfo}
        
        Error Feedback: {error_feedback}
        
        Rules:
        1. Use SELECT DISTINCT for the specified filtering columns only.
        2. Include only the tables necessary for the filtering columns in the FROM and JOIN clauses.
        3. Use the provided join conditions to connect tables, but only include joins necessary for the filtering columns.
        4. Do not include any WHERE clauses or additional filtering.
        5. Use table aliases if necessary for clarity.
        6. Ensure the query is compatible with PostgreSQL.
        7. If error feedback is provided, adjust the query to address the issue.
        8. Do not include any aggregations or GROUP BY clauses.
        9. The goal is to get unique combinations of values in the filtering columns, not to perform any calculations.

        Return only the SQL query without any additional explanation.
        """
        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm
        result = chain.invoke({
            "tables": ', '.join(tables),
            "joinConditions": json.dumps(joinConditions),
            "filteringColumns": ', '.join(filteringColumns),
            "tableInfo": tableInfo,
            "error_feedback": error_feedback
        })
        return result.content

    def determineFilterValues(self, distinctQueryResult: pd.DataFrame, userQuery: str) -> Dict[str, Any]:
        template = """
        Given the following user query and distinct values for potential filtering columns, determine the appropriate filter values to use in the SQL query.
        
        User Query: {userQuery}
        
        Distinct Values:
        {distinctValues}
        
        Return a JSON object where the keys are column names and the values are the filter values to use. If a column should not be used for filtering, omit it from the result.
        Just return a json object that can be loaded into json directly and nothing else.
        """
        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm
        result = chain.invoke({"userQuery": userQuery, "distinctValues": distinctQueryResult.to_json(orient='records')}).content
        result = result.replace('`', '').replace('json', '')
        return json.loads(result)

    def generateFinalQuery(self, tables: List[str], joinConditions: Dict[str, str], filteringColumns: List[str], filterValues: Dict[str, Any], userQuery: str, tableInfo: str, error_feedback: str = "") -> str:
        template = """
        Generate a SQL query based on the following information:
        
        User Query: {userQuery}
        Tables: {tables}
        Join Conditions: {joinConditions}
        Filtering Columns: {filteringColumns}
        Filter Values: {filterValues}
        
        Table Information:
        {tableInfo}
        
        Error Feedback: {error_feedback}
        
        Rules:
        1. Generate a complete SQL query that answers the user's question.
        2. Include appropriate SELECT, FROM, JOIN, and WHERE clauses.
        3. Use the provided join conditions to connect tables.
        4. Use the filtering columns and filter values to create appropriate WHERE conditions.
        5. Do not use subqueries; use CTEs if necessary.
        6. Ensure the query is compatible with PostgreSQL.
        7. Use table aliases if necessary for clarity.
        8. If error feedback is provided, adjust the query to address the issue.
        9. ONLY use column names that are explicitly mentioned in the Table Information.
        10. Do not hallucinate or invent column names.

        Return only the SQL query without any additional explanation.
        """
        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm
        result = chain.invoke({
            "userQuery": userQuery,
            "tables": ', '.join(tables),
            "joinConditions": json.dumps(joinConditions),
            "filteringColumns": ', '.join(filteringColumns),
            "filterValues": json.dumps(filterValues),
            "tableInfo": tableInfo,
            "error_feedback": error_feedback
        })
        return result.content

    def applyCRAG(self, query: str, tableInfo: str, userQuery: str) -> str:
        template = """
        You are a SQL expert. Review the following SQL query and ensure it follows all the rules and is runnable. 
        Do not hallucinate on table names, column names, or join conditions. Only use information provided in the Table Information.

        SQL Query:
        {query}

        Table Information:
        {tableInfo}

        Rules to check:
        1. All table names used in the query exist in the Table Information.
        2. All column names used in the query exist in their respective tables as per the Table Information.
        3. Join conditions use existing tables and columns.
        4. The query structure is valid PostgreSQL syntax.
        5. No subqueries are used (CTEs are allowed).
        6. The query addresses the User Query without adding extraneous information.

        User Query: {userQuery}

        If the query violates any rules or is not runnable, provide a corrected version. 
        If the query is correct and follows all rules, return it as is.

        Corrected SQL Query:
        """
        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm
        result = chain.invoke({
            "query": query,
            "tableInfo": tableInfo,
            "userQuery": userQuery
        })
        return result.content

## Under Development
# class PolimapTableSelector:
#     def __init__(self, llm: BaseLanguageModel):
#         self.llm = llm
#         self.polimapPrompt = self._loadPolimapPrompt()

#     def _loadPolimapPrompt(self):
#         with open(polimapPromptPath, 'r') as file:
#             return file.read()
#     def selectTables(self, userQuery: str) -> str:
#         template = """
#         {polimapPrompt}

#         User question: {userQuery}

#         Based on this question, which tables would you recommend using to find the answer? Please provide a comma-separated list of table names, without any additional explanation.

#         Tables:
#         """

#         prompt = PromptTemplate.from_template(template)
#         chain = prompt | self.llm
#         return chain.invoke({"userQuery": userQuery, "polimapPrompt": self.polimapPrompt}).content.strip()

## Under Development
# class RouterAgent:
#     def __init__(self, llm: BaseLanguageModel):
#         self.llm = llm
#         self.multiDBPrompt = self._loadMultiDBPrompt()

#     def _loadMultiDBPrompt(self):
#         with open(multiDBPromptPath, 'r') as file:
#             return file.read()

#     def determineQueryType(self, userQuery: str, chatHistory: str = '') -> str:
#         template = """
#         {multiDBPrompt}

#         User question: {userQuery}

#         Chat History: {chatHistory}
        
#         Based on this question and chat history, which option would you recommend? 
#         Respond with either "elecdata", "polimap", or "chat".
#         Your response should be just one of these three words.

#         Query Type:
#         """

#         prompt = PromptTemplate.from_template(template)
#         chain = prompt | self.llm
#         return chain.invoke({"userQuery": userQuery, "chatHistory": chatHistory, "multiDBPrompt": self.multiDBPrompt}).content.strip().lower()

#     def generateChatResponse(self, userQuery: str, chatHistory: str = '') -> str:
#         template = """You are an AI assistant specializing in Australian political and demographic data analysis.

#         Chat History: {chatHistory}
#         User Query: {userQuery}

#         Provide a helpful and engaging response to the user's query. Do not assume any information not provided in the chat history. If you're unsure about specific data points, you can mention that you don't have access to the latest data and provide general information instead.

#         Response:
#         """

#         prompt = PromptTemplate.from_template(template)
#         chain = prompt | self.llm
#         return chain.invoke({"userQuery": userQuery, "chatHistory": chatHistory}).content.strip()
