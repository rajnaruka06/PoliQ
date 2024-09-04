## CustomAgents.py

from typing import Dict, Any, Optional
from langchain_core.prompts import PromptTemplate
from langchain.base_language import BaseLanguageModel
import pandas as pd
import os

resourcesPath = os.path.join(os.path.dirname(__file__), '../resources')
envPath = os.path.join(resourcesPath, '.ENV')
polimapPromptPath = os.path.join(resourcesPath, 'polimapPrompt.txt')
multiDBPromptPath = os.path.join(resourcesPath, 'multiDBPrompt.txt')

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

## Under Development
class PolimapTableSelector:
    def __init__(self, llm: BaseLanguageModel):
        self.llm = llm
        self.polimapPrompt = self._loadPolimapPrompt()

    def _loadPolimapPrompt(self):
        with open(polimapPromptPath, 'r') as file:
            return file.read()
    def selectTables(self, userQuery: str) -> str:
        template = """
        {polimapPrompt}

        User question: {userQuery}

        Based on this question, which tables would you recommend using to find the answer? Please provide a comma-separated list of table names, without any additional explanation.

        Tables:
        """

        prompt = PromptTemplate.from_template(template)
        chain = prompt | self.llm
        return chain.invoke({"userQuery": userQuery, "polimapPrompt": self.polimapPrompt}).content.strip()

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
