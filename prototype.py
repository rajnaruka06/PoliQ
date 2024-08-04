import streamlit as st
from dotenv import load_dotenv
import pandas as pd
import ast
from collections import deque

from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_community.utilities import SQLDatabase
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

@st.cache_resource
def getDB():
    username = st.secrets["POSTGRES_USER"]
    password = st.secrets["POSTGRES_PASSWORD"]
    host = st.secrets["POSTGRES_HOST"]
    port = st.secrets["POSTGRES_PORT"]
    database = "chinook"

    postgresql_uri = f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}"

    db = SQLDatabase.from_uri(postgresql_uri)
    return db

@st.cache_resource
def getLLM():
    api_key = st.secrets["OPENAI_API_KEY"]
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
        api_key= api_key
    )
    return llm

@st.cache_resource
def get_sample_queries():
    sample_queries = [
        "Retrieve the album title and the artist name for each album."
        , 'Retrieve the first and last names of customers who have made purchases along with the total amount of their invoices.'
        , 'Retrieve the number of tracks in each album along with the album title and artist name. Sort the results by the number of tracks in descending order.'
        , 'Retrieve the artists name and number of tracks by each artist. Sort the results by the number of tracks in descending order. Only include artists with more than 10 tracks.'
        , "Retrieve the total sales (sum of invoice totals) for each artist, showing only the artist name and total sales. And give results in descending order of total sales."
        , "Retrieve the customer names (first and last) who have spent more than the average total of all invoices."
        , "Retrieve the names of the top 5 customers based on the total amount spent, along with the total amount they spent and the total number of invoices"
        , "Create a view to encapsulate the total sales for each customer and then use this view to retrieve customers who have spent more than $100"
    ]

    return sample_queries

@st.cache_data
def get_table_definitions(table_names):
    table_definitions = dict()
    for table in table_names:
        table_definitions[table] = db.get_table_info([table]).strip().split('/*')[0]
    return table_definitions


if __name__ == "__main__":
    load_dotenv()

    st.title("PoliQ")
    st.header("Project Description goes here...")

    db = getDB()
    llm = getLLM()

    query_runner = QuerySQLDataBaseTool(db = db)
    sample_queries = get_sample_queries()

    db_agent_template = """Given an input question, just create a syntactically correct {dialect} query to run.
    Use the following format:

    Question: "Question here"
    SQLQuery: "SQL Query to run"

    Only use the following tables:

    {table_info}.

    Question: {input}
    SQLQuery: 
    """

    table_names = db.get_usable_table_names()
    table_definitions = get_table_definitions(table_names)

    db_agent_prompt = PromptTemplate.from_template(db_agent_template)
    db_chain = db_agent_prompt | llm

    selected_sample = st.selectbox("Select a sample question:", sample_queries)
    user_query = st.text_area("Or Enter your Own question here:", height=200)
    if st.button("Get results"):
        user_query = selected_sample if user_query == "" else user_query
        sql_query = db_chain.invoke({
            "input": user_query
            , "dialect": db.dialect
            , "table_info": table_definitions
        }).content.strip()
        
        try:
            sql_query = sql_query.split('"')[1]
            
            columns = sql_query.split('SELECT')[1].split('FROM')[0].strip().split(',')
            columns = [col.strip().split(' ')[-1].split('.')[-1] for col in columns]

            st.write("---")
            st.subheader("Generated SQL Query:")
            st.write(sql_query)

            st.write("---")
            st.subheader("Fetched Results:")
            res = query_runner.invoke(sql_query)
            res = res.replace('Decimal', '')
            res = ast.literal_eval(res)
            res = pd.DataFrame.from_records(data = res, columns=columns)
        ## Catch syntax errors
        except SyntaxError:
            res = "Invalid SQL Query generated. Please try again. (maybe try rephrasing the question)"
        st.write(res)        