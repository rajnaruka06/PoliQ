## CustomAgents.py

from typing import Dict, Any, Optional, List
from langchain_core.prompts import PromptTemplate
from langchain.base_language import BaseLanguageModel
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
import pandas as pd
import os

resourcesPath = os.path.join(os.path.dirname(__file__), '../resources')
envPath = os.path.join(resourcesPath, '.ENV')

import logging
logger = logging.getLogger(__name__)

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
        - Do Not Assume Any information that is not provided.
        
        If SQL Query can not be generated, just return "invalid user query - not related to the database."

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
        Each summary should be phrased as if you're having a conversation with the user.
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
        - Each value should be inside double quotes like "123"
        - represent null values for RegionID as "None"

        Only include layers that are absolutely necessary to provide a complete and accurate response.

        Remember:
        1. Only include layers that are directly relevant to answering the user's specific query.
        2. Aim for the smallest possible set of layers that can fully address the query.
        3. Do not include any layer unless you are certain it will contribute to answering the user's question.
        4. More than one layer might be needed to answer the user query correctly, but look for the least number of layers possible.
        5. If there are no relevant data or regions to answer the query, return an empty list [].
        6. Always try to include a specific RegionID. Only omit the RegionID if the query doesn't specify or imply any particular region and no region from the metadata is relevant.
        7. Do not return any other information apart from the JSON array.
        8. Consider whether the query requires comparing or correlating multiple datasets. For example:
        - Queries about impact, influence, or relationships between factors will typically need multiple layers
        - Questions comparing demographic data with voting patterns require both demographic and electoral layers
        - Analysis of trends or patterns may require multiple related datasets
        9. Carefully consider the temporal aspect of the query:
        - For queries about current situations or those without specific time references (e.g., "What is the population in Wills?"), use the most recent available dataset
        - For historical queries (e.g., "How has voting changed since 2019?"), include datasets from all relevant years
        - For trend analysis (e.g., "Show the demographic changes over the last decade"), include datasets covering the specified time period
        - For comparative queries across time periods (e.g., "Compare 2019 and 2022 election results"), include datasets from all mentioned time periods
        10. When multiple years of data are available:
        - If the query implies "current" or "now", use the most recent year
        - If the query mentions specific years or time periods, use those exact years
        - If the query asks about changes or trends, include all relevant years within the specified period


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
            # logger.info(f"DatasetRegionMatcherAgent: {result}")
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