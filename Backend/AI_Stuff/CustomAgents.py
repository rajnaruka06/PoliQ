## CustomAgents.py

from langchain_core.prompts import PromptTemplate
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from langchain.tools import StructuredTool
import json

class SQLExpert:
    def __init__(self, llm):
        self.llm = llm

    def generate_query(self, user_query: str, dialect: str, table_info: str, chat_history: str = '') -> str:
        dba_agent_template = """Given an input question, just create a syntactically correct {dialect} query to run.
        Do not Assume any table or columns that are not mentioned.
        Do not include any CREATE, DELETE, UPDATE, or ALTER statements in your responses.
        Use Common Table Expressions (CTEs) for data manipulation instead of subqueries.
        Never use * in the SELECT statement. Always specify the columns you want to retrieve. Even if you are querying from Common Table Expressions.
        Use group by instead of distinct where applicable.
        Do not include any LIMIT, or OFFSET clauses in your responses unless the user query requires it.
        Use the information from the chat history if they add context or relevant details to the current question. Focus primarily on the most recent and relevant questions. If the previous questions do not add any context, just focus on the current question.
        If the query can not be generated, your response should just be one sentence: "Invalid User Query - Not related to the Database".
        Only use the following tables:

        {table_info}.

        Chat History: {chat_history}
        Current Question: {user_query}
        SQLQuery:
        """
        dba_agent_prompt = PromptTemplate.from_template(dba_agent_template)
        dba_chain = dba_agent_prompt | self.llm
        sql_query = dba_chain.invoke({
            "user_query": user_query,
            "dialect": dialect,
            "table_info": table_info,
            "chat_history": chat_history
        }).content.strip()


        sql_query = self.correct_query(sql_query, dialect, table_info, user_query, chat_history)

        return sql_query

    def correct_query(self, sql_query: str, dialect: str, table_info: str, user_query: str, chat_history: str) -> str:
        corrective_template = """You are a SQL expert. Given a generated SQL query, evaluate it to ensure it adheres to the following criteria:
        - Does not Assume any table or columns that are not mentioned.
        - Does not include any CREATE, DELETE, UPDATE, or ALTER statements in your responses.
        - Using Common Table Expressions (CTEs) for data manipulation instead of subqueries.
        - No use of * in the SELECT statement. The columns wanted are always specified to retrieve. Even while querying from Common Table Expressions.
        - Group by is used instead of distinct where applicable.
        - This is a syntactically correct {dialect} query to run using Only the tables and columns that are mentined in the database.

        Do not include an improved SQL Query and do not write or suggest any code. Just provide feedback on the existing query and suggest improvements.
        If the query is already good, your response should just be one word: "All good". Otherwise, provide feedback and suggest improvements. 
        If the query can not be generated, your response should just be one sentence: "Invalid User Query - Not related to the Database".
        Do not include an improved query.

        Table Info: {table_info}
        Chat History: {chat_history}
        User Query: {user_query}
        Generated SQL Query: {sql_query}
        Correction:
        """
        corrective_prompt = PromptTemplate.from_template(corrective_template)
        corrective_chain = corrective_prompt | self.llm
        correction_result = corrective_chain.invoke({
            "user_query": user_query,
            "sql_query": sql_query,
            "dialect": dialect,
            "table_info": table_info,
            "chat_history": chat_history
        }).content.strip()

        if correction_result.lower().strip() != "all good":
            sql_query = self.adjust_query(sql_query, dialect, table_info, user_query, correction_result, chat_history)

        return sql_query

    def adjust_query(self, sql_query: str, dialect: str, table_info: str, user_query: str, correction: str, chat_history: str) -> str:
        adjustment_template = """You are a SQL expert. Given a generated SQL query, correction feedback, dialect, table information, and user query, adjust the query to make it more accurate and better answer the user query.
        If the query can not be generated, your response should just be one sentence: "Invalid User Query - Not related to the Database".
        If no changes are required, return the original query as is.
        If changes are required, follow these rules:
        - Do not Assume any table or columns that are not mentioned.
        - Do not include any CREATE, DELETE, UPDATE, or ALTER statements in your responses.
        - Use Common Table Expressions (CTEs) for data manipulation instead of subqueries.
        - Never use * in the SELECT statement. Always specify the columns you want to retrieve. Even if you are querying from Common Table Expressions.
        - Use group by instead of distinct where applicable.
        - Do not include any LIMIT, or OFFSET clauses in your responses unless the user query requires it.
        - Use the information from the chat history if they add context or relevant details to the current question. Focus primarily on the most recent and relevant questions. If the previous questions do not add any context, just focus on the current question.

        Dialect: {dialect}
        Table Info: {table_info}
        User Query: {user_query}
        Chat History: {chat_history}
        Generated SQL Query: {sql_query}
        Correction Feedback: {correction}
        Adjusted SQL Query:
        """
        adjustment_prompt = PromptTemplate.from_template(adjustment_template)
        adjustment_chain = adjustment_prompt | self.llm
        adjusted_query = adjustment_chain.invoke({
            "user_query": user_query,
            "sql_query": sql_query,
            "dialect": dialect,
            "table_info": table_info,
            "correction": correction,
            "chat_history": chat_history
        }).content.strip()

        return adjusted_query

class ResponseSummarizer:
    def __init__(self, llm):
        self.llm = llm

    def summarize(self, user_query: str, dataframe) -> str:
        summary_agent_template = """As a data analyst, provide a concise chat-like response to the user's query based on the given DataFrame. Focus on key insights and trends that directly answer the query. Use natural language and keep it brief.

        User: {user_query}
        DataFrame: {dataframe}

        Assistant: """
        summary_agent_prompt = PromptTemplate.from_template(summary_agent_template)
        summary_chain = summary_agent_prompt | self.llm
        summary = summary_chain.invoke({"dataframe": dataframe.to_dict(), "user_query": user_query}).content.strip()

        summary = self.iterative_refinement(user_query, summary)
        return summary

    def iterative_refinement(self, user_query: str, summary: str, max_iterations = 3) -> str:
        for _ in range(max_iterations):
            reflection_result = self.self_reflect(user_query, summary)
            if reflection_result.lower().strip() == "all good":
                break
            summary = self.adjust_summary(user_query, summary, reflection_result)
        return summary

    def self_reflect(self, user_query: str, summary: str) -> str:
        reflection_template = """Evaluate this chat response for conciseness and relevance to the user's query. If it's good, just say "All good". Otherwise, suggest brief improvements.

        User: {user_query}
        Assistant: {summary}

        Reflection: """
        reflection_prompt = PromptTemplate.from_template(reflection_template)
        reflection_chain = reflection_prompt | self.llm
        reflection_result = reflection_chain.invoke({"user_query": user_query, "summary": summary}).content.strip()

        return reflection_result

    def adjust_summary(self, user_query: str, summary: str, reflection: str) -> str:
        adjustment_template = """Adjust this chat response to be more concise and relevant to the user's query, based on the given feedback.

        User: {user_query}
        Previous response: {summary}
        Feedback: {reflection}

        Improved response: """
        adjustment_prompt = PromptTemplate.from_template(adjustment_template)
        adjustment_chain = adjustment_prompt | self.llm
        adjusted_summary = adjustment_chain.invoke({"user_query": user_query, "summary": summary, "reflection": reflection}).content.strip()

        return adjusted_summary

# class ResponseSummarizer:
#     def __init__(self, llm):
#         self.llm = llm

#     def summarize(self, user_query: str, dataframe) -> str:
#         summary_agent_template = """You are a data analyst. Given a user query and a pandas DataFrame, summarize the data in a user-readable format.
#         Describe the key insights, trends, and any notable observations from the data that answer the user query.
#         Make sure to include statistics, comparisons, and any relevant details that provide a clear understanding of the data.

#         User Query: {user_query}
#         DataFrame:
#         {dataframe}
#         Summary:
#         """
#         summary_agent_prompt = PromptTemplate.from_template(summary_agent_template)
#         summary_chain = summary_agent_prompt | self.llm
#         summary = summary_chain.invoke({"dataframe": dataframe.to_dict(), "user_query": user_query}).content.strip()

#         summary = self.iterative_refinement(user_query, summary)

#         # print("\n--- Final Summary ---\n", summary)
#         return summary

#     def iterative_refinement(self, user_query: str, summary: str, max_iterations = 3) -> str:
#         for _ in range(max_iterations):
#             reflection_result = self.self_reflect(user_query, summary)
#             if reflection_result.lower().strip() == "all good":
#                 break
#             summary = self.adjust_summary(user_query, summary, reflection_result)
#         return summary

#     def self_reflect(self, user_query: str, summary: str) -> str:
#         reflection_template = """You are a data analyst. Given a user query and a generated summary, evaluate the summary to ensure it is concise and answers the user query in natural language.
#         If the summary is already good and no improvements are needed, your response should just be one word: "All good". Otherwise, provide feedback and suggest improvements. Do not include an improved summary.

#         User Query: {user_query}
#         Generated Summary: {summary}
#         Reflection:
#         """
#         reflection_prompt = PromptTemplate.from_template(reflection_template)
#         reflection_chain = reflection_prompt | self.llm
#         reflection_result = reflection_chain.invoke({"user_query": user_query, "summary": summary}).content.strip()

#         return reflection_result

#     def adjust_summary(self, user_query: str, summary: str, reflection: str) -> str:
#         adjustment_template = """You are a data analyst. Given a user query, a generated summary, and reflection feedback, adjust the summary to make it more concise and better answer the user user query.

#         User Query: {user_query}
#         Generated Summary: {summary}
#         Reflection Feedback: {reflection}
#         Adjusted Summary:
#         """
#         adjustment_prompt = PromptTemplate.from_template(adjustment_template)
#         adjustment_chain = adjustment_prompt | self.llm
#         adjusted_summary = adjustment_chain.invoke({"user_query": user_query, "summary": summary, "reflection": reflection}).content.strip()


#         if adjusted_summary.startswith('### Adjusted Summary:'):
#             adjusted_summary = adjusted_summary[len('### Adjusted Summary:'):].strip()

#         return adjusted_summary

class SQLExpertMultiDB:
    def __init__(self, llm, schema_file_path):
        self.llm = llm
        self.schema_file_path = schema_file_path
        self.schema_info = self._load_schema_info()

    def _load_schema_info(self):
        with open(self.schema_file_path, 'r') as file:
            return json.load(file)

    def generate_query(self, user_query: str, dialect: str, chat_history: str = '') -> str:
        response_schemas = [
            ResponseSchema(name="database_name", description="The name of the database to query"),
            ResponseSchema(name="sql_query", description="The SQL query to execute")
        ]
        output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

        dba_agent_template = """Given an input question, create a syntactically correct {dialect} query to run.
        Do not assume any table or columns that are not mentioned.
        Do not include any CREATE, DELETE, UPDATE, or ALTER statements in your responses.
        Use Common Table Expressions (CTEs) for data manipulation instead of subqueries.
        Never use * in the SELECT statement. Always specify the columns you want to retrieve. Even if you are querying from Common Table Expressions.
        Use group by instead of distinct where applicable.
        Do not include any LIMIT, or OFFSET clauses in your responses unless the user query requires it.
        Use the information from the chat history if they add context or relevant details to the current question. Focus primarily on the most recent and relevant questions. If the previous questions do not add any context, just focus on the current question.
        If the query cannot be generated, your response should just be one sentence: "Invalid User Query - Not related to the Database".

        You have access to the following databases and their tables:

        {schema_info}

        Based on the user query, determine which database to use and create the appropriate SQL query.

        Chat History: {chat_history}
        Current Question: {user_query}

        {format_instructions}
        """
        dba_agent_prompt = PromptTemplate(
            template=dba_agent_template,
            input_variables=["dialect", "schema_info", "chat_history", "user_query"],
            partial_variables={"format_instructions": output_parser.get_format_instructions()}
        )
        dba_chain = dba_agent_prompt | self.llm

        result = dba_chain.invoke({
            "user_query": user_query,
            "dialect": dialect,
            "schema_info": json.dumps(self.schema_info, indent=2),
            "chat_history": chat_history
        })

        try:
            parsed_output = output_parser.parse(result.content)
            sql_query = parsed_output["sql_query"]
            database_name = parsed_output["database_name"]
        except Exception:
            return json.dumps({"error": "Failed to parse the output"})

        corrected_query = self._correct_query(sql_query, dialect, database_name, user_query, chat_history)

        return json.dumps({
            "database_name": database_name,
            "sql_query": corrected_query
        })

    def _correct_query(self, sql_query: str, dialect: str, database_name: str, user_query: str, chat_history: str) -> str:
        corrective_template = """You are a SQL expert. Given a generated SQL query, evaluate it to ensure it adheres to the following criteria:
        - Does not Assume any table or columns that are not mentioned.
        - Does not include any CREATE, DELETE, UPDATE, or ALTER statements in your responses.
        - Using Common Table Expressions (CTEs) for data manipulation instead of subqueries.
        - No use of * in the SELECT statement. The columns wanted are always specified to retrieve. Even while querying from Common Table Expressions.
        - Group by is used instead of distinct where applicable.
        - This is a syntactically correct {dialect} query to run using Only the tables and columns that are mentioned in the database.

        Do not include an improved SQL Query and do not write or suggest any code. Just provide feedback on the existing query and suggest improvements.
        If the query is already good, your response should just be one word: "All good". Otherwise, provide feedback and suggest improvements. 
        If the query can not be generated, your response should just be one sentence: "Invalid User Query - Not related to the Database".
        Do not include an improved query.

        Schema Info: {schema_info}
        Chat History: {chat_history}
        User Query: {user_query}
        Generated SQL Query: {sql_query}
        Correction:
        """
        corrective_prompt = PromptTemplate.from_template(corrective_template)
        corrective_chain = corrective_prompt | self.llm
        correction_result = corrective_chain.invoke({
            "user_query": user_query,
            "sql_query": sql_query,
            "dialect": dialect,
            "schema_info": json.dumps(self.schema_info[database_name], indent=2),
            "chat_history": chat_history
        }).content.strip()

        if correction_result.lower().strip() != "all good":
            sql_query = self._adjust_query(sql_query, dialect, database_name, user_query, correction_result, chat_history)

        return sql_query

    def _adjust_query(self, sql_query: str, dialect: str, database_name: str, user_query: str, correction: str, chat_history: str) -> str:
        adjustment_template = """You are a SQL expert. Given a generated SQL query, correction feedback, dialect, schema information, and user query, adjust the query to make it more accurate and better answer the user query.
        If the query can not be generated, your response should just be one sentence: "Invalid User Query - Not related to the Database".
        If no changes are required, return the original query as is.
        If changes are required, follow these rules:
        - Do not Assume any table or columns that are not mentioned.
        - Do not include any CREATE, DELETE, UPDATE, or ALTER statements in your responses.
        - Use Common Table Expressions (CTEs) for data manipulation instead of subqueries.
        - Never use * in the SELECT statement. Always specify the columns you want to retrieve. Even if you are querying from Common Table Expressions.
        - Use group by instead of distinct where applicable.
        - Do not include any LIMIT, or OFFSET clauses in your responses unless the user query requires it.
        - Use the information from the chat history if they add context or relevant details to the current question. Focus primarily on the most recent and relevant questions. If the previous questions do not add any context, just focus on the current question.

        Dialect: {dialect}
        Schema Info: {schema_info}
        User Query: {user_query}
        Chat History: {chat_history}
        Generated SQL Query: {sql_query}
        Correction Feedback: {correction}
        Adjusted SQL Query:
        """
        adjustment_prompt = PromptTemplate.from_template(adjustment_template)
        adjustment_chain = adjustment_prompt | self.llm
        adjusted_query = adjustment_chain.invoke({
            "user_query": user_query,
            "sql_query": sql_query,
            "dialect": dialect,
            "schema_info": json.dumps(self.schema_info[database_name], indent=2),
            "correction": correction,
            "chat_history": chat_history
        }).content.strip()

        return adjusted_query

    def query_tool(self) -> StructuredTool:
        return StructuredTool.from_function(
            func=self.generate_query,
            name="SQL_Query_Generator",
            description="Generates SQL queries based on user input and database information",
            return_direct=True,
            args_schema={
                "user_query": str,
                "dialect": str,
                "chat_history": str
            }
        )