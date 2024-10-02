## CustomAgents.py

from typing import Dict, Any, Optional, List
from langchain_core.prompts import PromptTemplate
from langchain.base_language import BaseLanguageModel
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
import pandas as pd
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
        - Do not include any LIMIT, OFFSET unless explicitly mentioned in the user query.
        - While filtering using subquery use 'in' instead of '='.

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

    def extractWhereColumns(self, sqlQuery: str) -> List[Dict[str, str]]:
        template = """Given the following SQL query:
        {sqlQuery}
        
        Extract the distinct column names and their corresponding table names used in the WHERE clause.
        Use column that are hardcoded for filtering.

        example:
        SELECT * FROM table1 WHERE column1 = 'value1' AND column2 IN (SELECT column3 FROM table2 WHERE column4 = 'value2');
        Here, we want to extract column1 and column4 but not column2.

        Respond in the following JSON format:
        [
            {{
                "table": "table_name",
                "column": "column_name"
            }},
            ...
        ]
        """
        
        response = self._invokeChain(template, sqlQuery=sqlQuery)
        return response

    def updateWhereConditions(self, originalQuery: str, userQuery: str, context: str) -> str:
        template = """Given the following information:
        
        Original SQL Query:
        {originalQuery}
        
        User Query:
        {userQuery}
        
        Context:
        {context}
        
        Update the WHERE conditions in the original SQL query based on the user query and the provided context.
        Only modify the WHERE conditions, keeping the rest of the query unchanged.
        Only return the updated SQL query, nothing else.
        
        Updated SQL Query:
        """
        
        response = self._invokeChain(template, originalQuery=originalQuery, userQuery=userQuery, context=context)
        return response.strip()

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

class DatasetRegionMatcherAgent:
    def __init__(self, llm: BaseLanguageModel):
        self.llm = llm
        self.outputParser = self._createOutputParser()
        self.prompt = self._createPrompt()
        self.chain = self.prompt | self.llm | self.outputParser

    def _createOutputParser(self):
        return StructuredOutputParser.from_response_schemas([
            ResponseSchema(
                name="layers",
                description="A JSON string representing a list of layers, where each layer is an array [RegionID, DatasetID, Level]. RegionID should be included whenever possible. DatasetID is necessary. Level is one of 'top', 'booth', or 'SA1'. Return an empty list [] if there are no relevant data/regions."
            )
        ])

    def _createPrompt(self):
        template = """You are an AI assistant specializing in electoral and census data. Your task is to identify the minimum set of layers necessary to answer the user's query based on the provided metadata.
        Metadata is in format: [ID]: [Description]

        Regions Metadata:
        {regions_metadata}

        Datasets Metadata:
        {datasets_metadata}

        User Query: {user_query}

        Based on the user's query and the provided metadata, determine the minimum set of layers required to fully answer the query. Each layer should be represented as [RegionID, DatasetID, Level], where:
        - RegionID should be included whenever possible. Only omit it if there is absolutely no relevant region for the query.
        - DatasetID is necessary
        - Level is one of "top" (for CEDs), "booth" (for polling booths), or "SA1" (for Statistical Areas)

        Only include layers that are absolutely necessary to provide a complete and accurate response.

        Remember:
        1. Only include layers that are directly relevant to answering the user's specific query.
        2. Aim for the smallest possible set of layers that can fully address the query.
        3. Do not include any layer unless you are certain it will contribute to answering the user's question.
        4. More than one layer might be needed to answer the user query correctly, but look for the least number of layers possible.
        5. If there are no relevant data or regions to answer the query, return an empty list [].
        6. Always try to include a specific RegionID. Only omit the RegionID if the query doesn't specify or imply any particular region and no region from the metadata is relevant.
        7. Do not return any other information apart from the JSON array.

        {format_instructions}
        """
        
        return PromptTemplate(
            template=template,
            input_variables=["regions_metadata", "datasets_metadata", "user_query"],
            partial_variables={"format_instructions": self.outputParser.get_format_instructions()}
        )

    def match(self, userQuery, regionsMetadata, datasetsMetadata):
        try:
            result = self.chain.invoke({
                "regions_metadata": regionsMetadata,
                "datasets_metadata": datasetsMetadata,
                "user_query": userQuery
            })
            return result
        except Exception as e:
            raise RuntimeError(f"Error processing LLM output: {str(e)}")
        
class AnalystAgent:
    def __init__(self, llm):
        self.llm = llm

    def generateAnalysis(self, userQuery: str, dataframes_info: List[Dict[str, str]]) -> str:
        template = """You are a data analysis expert. Analyze the datasets based on the user query and provide only executable Python code as your response.

        Context:
        - User query: {userQuery}
        - Datasets: Available as a list of DataFrames named 'dfs'
        - Pre-imported modules: pandas as pd, numpy as np

        Datasets Overview:
        {dataframes_overview}

        Instructions:
        1. Read the user query and datasets information carefully.
        2. Write Python code that directly answers the query using the 'dfs' list of DataFrames.
        3. Use only pandas (pd) and numpy (np) operations.
        4. Do not import any libraries or define the datasets.
        5. Ensure the code is complete, correct, and can be executed as-is.
        6. Return only the Python code, without any explanations or comments.
        7. Only use the Columns in the DataFrames provided.
        8. The python code should always return a dataframe as the result.
        9. Do not assume any dataframes except the ones provided in the dataframes_overview.

        Python Code:
        """
        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm
        return chain.invoke({"userQuery": userQuery, "dataframes_overview": dataframes_info})