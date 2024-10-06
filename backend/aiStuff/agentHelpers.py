## agentHepers.py

import os
import re
import ast
import io
import json
import logging
from typing import List, Dict, Any, Tuple, Optional, TypedDict
from decimal import Decimal
from datetime import datetime, timezone, date
import sqlparse
from sqlparse.sql import IdentifierList, Identifier
from sqlparse.tokens import Keyword, DML
from dotenv import load_dotenv
from contextlib import contextmanager
from sqlalchemy import create_engine
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy.sql import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

import pandas as pd
import tiktoken
from PyPDF2 import PdfReader
import pymongo
from pymongo import MongoClient, TEXT
from pymongo.errors import OperationFailure
from bson import ObjectId
import gridfs

from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_community.tools import DuckDuckGoSearchRun
from langchain.schema import Document
from langchain.vectorstores.pgvector import PGVector ## Try with from langchain_community.vectorstores import PGVector


## Setting up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

## Loading environment variables
recourcesPath = os.path.join(os.path.dirname(__file__), '../resources')
envPath = os.path.join(recourcesPath, '.ENV')
load_dotenv(dotenv_path=envPath)

## Type aliases
Message = TypedDict('Message', {
    'messageId': str,
    'user': str,
    'content': str,
    'date': str,
    'time': str
})

UserDocument = TypedDict('UserDocument', {
    'docId': str,
    'filename': str,
    'fileType': str,
    'uploadDate': datetime
})

ChatDocument = TypedDict('ChatDocument', {
    'chatId': str,
    'date': str,
    'title': str,
    'pinned': bool,
    'archived': bool,
    'lastUpdated': datetime,
    'messages': List[Message],
    'documents': List[UserDocument]
})

## Defining Custom exceptions
class NoDataFoundException(Exception):
    """Raised when no data is fetched from the database"""
    def __init__(self, message="No data fetched from the database"):
        self.message = message
        super().__init__(self.message)

class InvalidUserQueryException(Exception):
    """Raised when the query is not related to the Database Schema or cannot be answered from the database"""
    def __init__(self, message="Query is not related to the Database Schema or cannot be answered from the database"):
        self.message = message
        super().__init__(self.message)

class NoResultsFoundException(Exception):
    """Exception raised when no search results are found."""
    def __init__(self, message="No search results found"):
        self.message = message
        super().__init__(self.message)

class ChatHistoryError(Exception):
    """Custom Exception raised for ChatHistory Errors"""
    def __init__(self, message="Chat History Error."):
        self.message = message
        super().__init__(self.message)

def loadFromMongo(collectionName: str, fileName: str) -> str:
    """
    Load metadata from MongoDB.

    Args:
        collectionName (str): Name of the MongoDB collection.
        fileName (str): Name of the file to retrieve metadata for.

    Returns:
        str: Metadata content as a string.

    Raises:
        pymongo.errors.PyMongoError: If there's an error connecting to MongoDB or retrieving the metadata.
        ValueError: If the MONGODB_URI environment variable is not set.
    """
    mongodb_uri = os.environ.get('MONGO_URI')
    if not mongodb_uri:
        logger.error("MONGODB_URI environment variable is not set")
        raise ValueError("MONGODB_URI environment variable is not set")

    client = None
    try:
        client = MongoClient(mongodb_uri)
        db = client['Resources']
        collection = db[collectionName]
        
        metadata = collection.find_one({'name': fileName})
        
        if metadata and 'content' in metadata:
            logger.info(f"Successfully loaded metadata for {fileName}")
            return metadata['content']
        else:
            logger.warning(f"No metadata found for: {fileName}")
            return ''
    except pymongo.errors.PyMongoError as e:
        logger.error(f"Error loading metadata for {fileName}: {str(e)}")
        raise
    finally:
        if client:
            client.close()
            logger.debug("MongoDB connection closed")

@contextmanager
def loadPostgresDatabase(dbName: str):
    """
    Context manager for loading a PostgreSQL database using environment variables.
    
    Args:
        dbName (str): Name of the database to connect to.
    
    Yields:
        SQLDatabase: A connected SQLDatabase instance.
    
    Raises:
        ValueError: If required environment variables are not set.
    """
    requiredEnvVars = ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_HOST', 'POSTGRES_PORT']
    for var in requiredEnvVars:
        if not os.environ.get(var):
            raise ValueError(f"Environment variable {var} is not set")
    
    uri = f"postgresql+psycopg2://{os.environ['POSTGRES_USER']}:{os.environ['POSTGRES_PASSWORD']}@{os.environ['POSTGRES_HOST']}:{os.environ['POSTGRES_PORT']}/{dbName}"
    engine = create_engine(uri)
    db = SQLDatabase(engine)
    try:
        yield db
    finally:
        engine.dispose()

def loadLLM(llmName: str = 'gpt', model: str = 'gpt-4o', temperature: float = 0, maxTokens: Optional[int] = None, timeout: Optional[int] = None, maxRetries: int = 2):
    """
    Loads a language model based on the provided parameters.
    
    Args:
        llmName (str): Name of the LLM to load ('gpt' or 'claude').
        model (str): Specific model to load.
        temperature (float): Temperature setting for the model.
        maxTokens (int, optional): Maximum number of tokens for the model output.
        timeout (int, optional): Timeout for the model in seconds.
        maxRetries (int): Maximum number of retries for failed requests.
    
    Returns:
        Union[ChatOpenAI, ChatAnthropic]: A loaded language model instance.
    
    Raises:
        ValueError: If an invalid LLM name is provided.
    """
    try:
        if llmName == 'gpt':
            return ChatOpenAI(
                model=model,
                temperature=temperature,
                max_tokens=maxTokens,
                timeout=timeout,
                max_retries=maxRetries
            )
        elif llmName == 'claude':
            return ChatAnthropic(
                model=model,
                temperature=temperature,
                timeout=timeout,
                max_retries=maxRetries
            )
        else:
            raise ValueError(f"Invalid LLM name: {llmName}")
    except Exception as e:
        logger.error(f"Error loading LLM: {e}")
        raise

def webSearch(query: str) -> str:
    """
    Performs a web search using DuckDuckGo.
    
    Args:
        query (str): The search query.
    
    Returns:
        str: The search results.
    """
    searchTool = DuckDuckGoSearchRun()
    return searchTool.run(query)

def cleanSqlQuery(sqlQuery: str) -> str:
    """
    Cleans and formats a SQL query string.
    
    Args:
        sqlQuery (str): The original SQL query string.
    
    Returns:
        str: The cleaned SQL query string.
    """
    if "3. FINAL SQL QUERY:" in sqlQuery:
        sqlQuery = sqlQuery.split("3. FINAL SQL QUERY:")[1].strip()
    
    sqlQuery = sqlQuery.replace("```sql", "").replace("```", "").strip()
    match = re.search(r'\b(with\s+\w+\s+as|select)\b', sqlQuery, re.IGNORECASE)
    if match:
        sqlQuery = sqlQuery[match.start():]

    semicolonIndex = sqlQuery.find(';')
    if semicolonIndex != -1:
        sqlQuery = sqlQuery[:semicolonIndex]

    return sqlQuery

def cleanSummaryResponse(summary: str) -> str:
        """
        Cleans and extracts the updated summary from the LLM response.
        
        Args:
            summary (str): The original summary string from the LLM response.
        
        Returns:
            str: The cleaned and extracted updated summary.
        """
        summary = summary.split("3. UPDATED SUMMARY:")[1].strip()
        summary = summary.replace("```", "").strip()
        summary = summary.strip()
        return summary

## Currenly only applying RAG to Datasets --> Can be extended to Regions as well
def populate_vectordb():
    VECTORDB_CONNECTION_STRING = os.getenv('VECTORDB_CONNECTION_STRING')
    VECTORDB_COLLECTION_NAME = os.getenv('VECTORDB_COLLECTION_NAME_DATASETS')
    embeddings = OpenAIEmbeddings()

    try:
        db = PGVector(
            collection_name=VECTORDB_COLLECTION_NAME,
            connection_string=VECTORDB_CONNECTION_STRING,
            embedding_function=embeddings
        )
        db.delete_collection()
        logger.info(f"Previous Vector DB: {VECTORDB_COLLECTION_NAME} deleted")
    except:
        logger.info(f"No previous Vector DB: {VECTORDB_COLLECTION_NAME} to delete")
        pass
    
    datasets = loadFromMongo('datasetsVectorDB', 'datasetsVectorDB')
    datasets = json.loads(datasets)

    logger.info(f"Populating Vector DB: {VECTORDB_COLLECTION_NAME} with {len(datasets['datasets'])} documents")
    
    documents = [Document(page_content=dataset['context'], metadata={'id': dataset['id']}) for dataset in datasets['datasets']]

    db = PGVector.from_documents(
        embedding=embeddings,
        documents=documents,
        collection_name=VECTORDB_COLLECTION_NAME,
        connection_string=VECTORDB_CONNECTION_STRING,
    )

    logger.info(f"Vector DB {VECTORDB_COLLECTION_NAME} populated with {len(documents)} documents")
    return db

def get_relevant_documents(query, k=10):
    VECTORDB_CONNECTION_STRING = os.getenv('VECTORDB_CONNECTION_STRING')
    VECTORDB_COLLECTION_NAME = os.getenv('VECTORDB_COLLECTION_NAME_DATASETS')
    embeddings = OpenAIEmbeddings()
    db = PGVector(
        collection_name=VECTORDB_COLLECTION_NAME,
        connection_string=VECTORDB_CONNECTION_STRING,
        embedding_function=embeddings
    )
    similar = db.similarity_search_with_score(query, k=k)
    return similar

class QuerySQLTool:
    """
    A tool for executing SQL queries on a database and processing the results.

    This class provides methods to execute SQL queries, parse the results,
    and convert them into pandas DataFrames. It includes custom parsing for
    special data types like Decimal, datetime, and date.

    Attributes:
        db (SQLDatabase): The database connection object.
        queryRunner (QuerySQLDataBaseTool): The tool used to run SQL queries.

    Methods:
        executeQuery(query: str) -> pd.DataFrame:
            Execute an SQL query and return the results as a DataFrame.
        getCols(sqlQuery: str) -> List[str]:
            Extract column names from an SQL query.

    Private Methods:
        _parseDecimal(match): Parse Decimal values from query results.
        _parseDatetime(match): Parse datetime values from query results.
        _parseDate(match): Parse date values from query results.
        _customParser(resStr: str): Custom parser for query result strings.

    Raises:
        InvalidUserQueryException: If the query is invalid or unrelated to the database.
        NoDataFoundException: If no data is returned from the query.
    """
    def __init__(self, dbName: str):
        self.dbName = dbName
    
    @contextmanager
    def _getDbConnection(self):
        with loadPostgresDatabase(self.dbName) as db:
            yield db
    
    def _validateSqlQuery(self, query: str) -> bool:
        """
        Validates the SQL query for potential SQL injection.
        
        Args:
            query (str): The SQL query to validate.
        
        Returns:
            bool: True if the query is valid, False otherwise.
        """

        parsed = sqlparse.parse(query)
        if not parsed:
            return False
        
        if len(parsed) > 1:
            return False

        statement = parsed[0]
        if statement.get_type() not in ('SELECT', 'WITH'):
            return False
        
        def check_tokens(token_list):
            for token in token_list:
                if token.ttype is Keyword and token.value.upper() in ('INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER'):
                    return False
                if isinstance(token, IdentifierList) or isinstance(token, Identifier):
                    if not check_tokens(token.tokens):
                        return False
            return True
        
        if not check_tokens(statement.tokens):
            return False

        return True
    
    def _getCols(self, sqlQuery: str) -> List[str]:
        """
        Extracts column names from an SQL query.
        
        Args:
            sqlQuery (str): The SQL query.
        
        Returns:
            List[str]: A list of column names.
        """
        selectRegex = re.compile(r'select\s+(.+?)\s+from', re.IGNORECASE | re.DOTALL)
        allMatches = selectRegex.findall(sqlQuery)
        if not allMatches:
            return []
        finalSelect = allMatches[-1]
        return [col.lower().strip().split(' as ')[-1].split('.')[-1] for col in finalSelect.split(',')]

    def _parseDecimal(self, match):
        value = match.group(1)
        return f"'{Decimal(value)}'"

    def _parseDatetime(self, match):
        dateArgs = list(map(int, match.group(1).split(',')))
        if 'tzinfo' in match.group(2):
            dt = datetime(*dateArgs, tzinfo=timezone.utc)
        else:
            dt = datetime(*dateArgs)
        return f"'{dt.isoformat()}'"

    def _parseDate(self, match):
        dateArgs = list(map(int, match.group(1).split(',')))
        dt = date(*dateArgs)
        return f"'{dt.isoformat()}'"
    
    def _customParser(self, resStr: str):
        resStr = re.sub(
            r"Decimal\('([^']+)'\)"
            , self._parseDecimal
            , resStr
        )
        resStr = re.sub(
            r"datetime\.datetime\(([\d, ]+)(, tzinfo=datetime\.timezone\.utc)?\)"
            , self._parseDatetime
            , resStr
        )
        resStr = re.sub(
            r"datetime\.date\(([\d, ]+)\)"
            , self._parseDate
            , resStr
        )
        return ast.literal_eval(resStr)
        
    def executeQuery(self, query: str) -> pd.DataFrame:
        """
        Executes an SQL query and return the results as a DataFrame.
        
        Args:
            query (str): The SQL query to execute.
        
        Returns:
            pd.DataFrame: The query results as a DataFrame.
        
        Raises:
            InvalidUserQueryException: If the query is invalid or unrelated to the database.
            NoDataFoundException: If no data is returned from the query.
        """
        with self._getDbConnection() as db:
            queryRunner = QuerySQLDataBaseTool(db=db)

            if query == "invalid user query - not related to the database.":
                raise InvalidUserQueryException("Query is not related to the database schema.")
            if not self._validateSqlQuery(query):
                raise InvalidUserQueryException("Invalid SQL query. Possible SQL injection attempt.")
            try:
                res = queryRunner.invoke(query)
                if not res:
                    raise NoDataFoundException("No data fetched from the database")
                res = self._customParser(res)
                columns = self._getCols(query)
                if len(columns) < len(res[0]):
                    columns = range(len(res[0]))
                return pd.DataFrame.from_records(data=res, columns=columns)
            except SyntaxError as e:
                logger.error(f"Error executing query: {e}\nSQL Query: {query}")
                raise InvalidUserQueryException("Invalid SQL query.")
            except Exception as e:
                Data = res if res else 'Can Not Fetch Data'
                logger.error(f"Error executing query: {e}\nSQL Query: {query}\nData: {Data}")
                raise

class ChatHistory:
    """
    This class manages chat history for users, storing and retrieving data from a MongoDB database.
    
    MongoDB Database Structure:
    - Database: ChatHistoryDB
    - Collection: <user_id> (Each user has a dedicated collection named after their user_id)
    - Chat Structure:
      {
        "chatId": <str>,             # Unique identifier for the chat session
        "date": <str>,                # Date the chat was created (YYYY-MM-DD format)
        "title": <str>,               # Short title for the chat (first 30 characters of the first message)
        "pinned": <bool>,             # Indicates if the chat is pinned
        "archived": <bool>,           # Indicates if the chat is archived
        "lastUpdated": <datetime>,   # Timestamp of the last update to the chat
        "groupDetails": {
          "groupName": <str>,        # Name of the group also unique identifier
          "groupColor": <str>,       # Color of the group (e.g., "red" or "blue")
        },
        "messages": [                 # Array of message objects
          {
            "messageID": <str>,       # Unique identifier for the message
            "user": <str>,            # "user" or "bot" to indicate the sender
            "content": <str>,         # The message content
            "date": <str>,            # Date the message was sent (YYYY-MM-DD format)
            "time": <str>             # Time the message was sent (HH:MM:SS format)
          },
          ...
        ],
        "documents": [                # Array of document objects
          {
            "doc_id": <str>,          # Unique identifier for the document
            "filename": <str>,        # Original filename of the uploaded document
            "file_type": <str>,       # File type (e.g., "csv" or "pdf")
            "upload_date": <datetime> # Date and time the document was uploaded
          },
          ...
        ]
      }
    
    Key Features:
    - Each user's chat history is stored in a separate collection, identified by `user_id`.
    - Each chat session is represented by a document, identified by `chatId`.
    - The `messages` field in the document contains an array of chat messages.
    - The `documents` field contains metadata about uploaded documents.
    - Actual document files are stored in GridFS.
    - Supports operations like adding messages, retrieving chat history, pinning/unpinning chats,
      archiving chats, searching through chat history, uploading documents, and retrieving documents.
    """
    def __init__(self, userId: str = "defaultUser", chatId: Optional[str] = None):
        self.userId = userId
        self.chatId = chatId
        self.client = None
        self.db = None
        self.collection = None
        self.fs = None

    @contextmanager
    def _getDbConnection(self):
        try:
            self._connectToDb()
            yield
        finally:
            if self.client:
                self.client.close()

    def _connectToDb(self) -> None:
        """Establish connection to MongoDB."""
        try:
            mongoUri = os.environ.get("MONGO_URI")
            dbName = os.environ.get("MONGO_DB_NAME")
            if not mongoUri or not dbName:
                raise ChatHistoryError("MongoDB connection details are not set in environment variables")

            self.client = MongoClient(mongoUri)
            self.db = self.client[dbName]
            self.collection = self.db[str(self.userId)]
            self.fs = gridfs.GridFS(self.db)
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise ChatHistoryError(f"Database connection error: {str(e)}")
        
    def _ensureTextIndex(self) -> None:
        """Ensures text index exists for message content."""
        try:
            indexes = list(self.collection.list_indexes())
            textIndexExists = any(
                index['key'] == [('messages.content', 'text')]
                for index in indexes
            )

            if not textIndexExists:
                indexName = "messagesContentTextIndex"
                fieldsToIndex = [("messages.content", TEXT)]
                self.collection.create_index(fieldsToIndex, name=indexName)
            else:
                logger.info("Text index for messages.content already exists.")
        except OperationFailure as e:
            logger.error(f"Failed to create or verify text index: {e}")
            raise ChatHistoryError(f"Failed to create or verify text index: {str(e)}")

    @staticmethod
    def _convertObjectId(data: Any) -> Any:
        """Converts ObjectId to string in nested structures."""
        if isinstance(data, dict):
            return {key: ChatHistory._convertObjectId(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [ChatHistory._convertObjectId(item) for item in data]
        elif isinstance(data, ObjectId):
            return str(data)
        return data

    def _checkDocumentReadability(self, fileContent: bytes, fileType: str) -> Tuple[bool, str]:
        """Checks if a document is readable and valid."""
        try:
            if fileType == 'csv':
                return self._checkCsvReadability(fileContent)
            elif fileType == 'pdf':
                return self._checkPdfReadability(fileContent)
            elif fileType == 'txt':
                return self._checkTxtReadability(fileContent)
            else:
                return False, "Unsupported file type."
        except Exception as e:
            return False, f"Error checking document readability: {str(e)}"

    @staticmethod
    def _checkCsvReadability(fileContent: bytes) -> Tuple[bool, str]:
        """Checks if a CSV file is readable."""
        try:
            content = io.BytesIO(fileContent)
            df = pd.read_csv(content)
            if df.empty:
                return False, "The CSV file is empty or contains no readable text."
            return True, "CSV is readable and valid."
        except Exception as e:
            return False, f"Error reading CSV with pandas: {str(e)}"

    @staticmethod
    def _checkPdfReadability(fileContent: bytes) -> Tuple[bool, str]:
        """Checks if a PDF file is readable."""
        try:
            reader = PdfReader(io.BytesIO(fileContent))
            textContent = "".join(page.extract_text() or "" for page in reader.pages)
            if not textContent.strip():
                return False, "The PDF file is empty or contains no readable text."
            return True, "PDF is readable and valid."
        except Exception as e:
            return False, f"Error reading PDF: {str(e)}"

    @staticmethod
    def _checkTxtReadability(fileContent: bytes) -> Tuple[bool, str]:
        """Checks if a TXT file is readable."""
        try:
            textContent = fileContent.decode('utf-8').strip()
            if not textContent:
                return False, "The TXT file is empty or contains no readable text."
            return True, "TXT is readable and valid."
        except Exception as e:
            return False, f"Error reading TXT: {str(e)}"

    def _getDocs(self, chatId: str) -> List[Dict[str, Any]]:
        """Gets documents associated with a chat."""
        with self._getDbConnection():
            chat = self.collection.find_one({"chatId": chatId}, {"documents": 1})
            return chat.get("documents", []) if chat else []

    def _getDocContent(self, docId: str) -> Tuple[Optional[str], Optional[bytes]]:
        """Gets content of a document from GridFS."""
        with self._getDbConnection():
            try:
                file = self.fs.get(ObjectId(docId))
                content = file.read()
                filename = file.filename
                return filename, content
            except gridfs.errors.NoFile:
                logger.error(f"No file found with id: {docId}")
                return None, None

    def _prepareDocsForLlm(self, chatId: str) -> str:
        """Prepares document content for LLM processing."""
        docs = self._getDocs(chatId)
        formattedDocs = []

        for doc in docs:
            filename, content = self._getDocContent(doc['docId'])
            if filename and content:
                textContent = self._extractTextContent(doc['fileType'], content, filename)
                if textContent:
                    formattedDocs.append(f"Document: {filename}\nContent: {textContent}\n")

        return "\n".join(formattedDocs)

    def _extractTextContent(self, fileType: str, content: bytes, filename: str) -> Optional[str]:
        """Extracts text content from different file types."""
        try:
            if fileType == 'csv':
                return self._extractCsvContent(content)
            elif fileType == 'pdf':
                return self._extractPdfContent(content)
            elif fileType == 'txt':
                return content.decode('utf-8')
            else:
                logger.warning(f"Unsupported file type: {fileType}")
                return None
        except Exception as e:
            logger.error(f"Error extracting content from {filename}: {str(e)}")
            return None

    @staticmethod
    def _extractCsvContent(content: bytes) -> str:
        """Extracts content from CSV file."""
        csvContent = io.BytesIO(content)
        df = pd.read_csv(csvContent)
        return df.to_string(index=False)

    @staticmethod
    def _extractPdfContent(content: bytes) -> str:
        """Extracts content from PDF file."""
        reader = PdfReader(io.BytesIO(content))
        textContent = "".join(page.extract_text() or "" for page in reader.pages)
        return textContent.strip()

    @staticmethod
    def _countTokens(text: str) -> int:
        """Counts the number of tokens in a string."""
        return len(tiktoken.get_encoding('cl100k_base').encode(text))
        
    def getAllChats(self) -> List[ChatDocument]:
        """Gets all chats for the user."""
        with self._getDbConnection():
            chats = self.collection.find({}, {"messages": 0})
            return [self._convertObjectId(chat) for chat in chats]
    
    def getMessage(self, chatId: str, messageId: str) -> Message:
        """Gets a specific message from a chat."""
        with self._getDbConnection():
            chat = self.collection.find_one({"chatId": chatId})

            if chat and "messages" in chat:
                for message in chat["messages"]:
                    if message["messageId"] == messageId:
                        return message

            raise ChatHistoryError(f"No message found with ID: {messageId} in chat: {chatId}")

    def getMessages(self, chatId: str) -> List[Message]:
        """Gets all messages for a specific chat."""
        with self._getDbConnection():
            chat = self.collection.find_one({"chatId": chatId}, {"messages": 1})
            return chat["messages"] if chat else []

    def getRecentMessages(self, chatId: str) -> List[Message]:
        """Gets recent messages for a specific chat, limited by token count."""
        tokenLimit = int(os.environ.get("CONTEXT_TOKEN_LIMIT", 4096))
        with self._getDbConnection():
            chat = self.collection.find_one({"chatId": chatId})
            
            if chat and "messages" in chat:
                messages = chat["messages"]
                recentMessages = []
                totalTokens = 0

                for message in reversed(messages):
                    messageText = message["content"]
                    messageTokens = self._countTokens(messageText)

                    if totalTokens + messageTokens > tokenLimit:
                        break
                    
                    recentMessages.append(message)
                    totalTokens += messageTokens

                return list(reversed(recentMessages))
            
            return []

    def getDocumentsContext(self, chatId: str) -> str:
        """Gets the context of all documents associated with a chat."""
        return self._prepareDocsForLlm(chatId)
    
    def getUploadedFiles(self, chatId: str) -> List[Dict[str, Any]]:
        """Gets the list of uploaded files for a specific chat."""
        with self._getDbConnection():
            chat = self.collection.find_one({"chatId": chatId}, {"documents": 1})
            if chat and "documents" in chat:
                return self._convertObjectId(chat["documents"])
            return []
        
    def getFileContent(self, docId: str) -> Tuple[Optional[str], Optional[bytes], Optional[str]]:
        """Gets the content, filename, and content type of a file from GridFS."""
        with self._getDbConnection():
            try:
                file = self.fs.get(ObjectId(docId))
                content = file.read()
                filename = file.filename
                content_type = file.content_type
                return filename, content, content_type
            except gridfs.errors.NoFile:
                logger.error(f"No file found with id: {docId}")
                return None, None, None
    
    def getLayers(self, chatId: str, messageId: str) -> List[List[str]]:
        """Gets layers associated with a specific message."""
        with self._getDbConnection():
            chat = self.collection.find_one(
                {"chatId": chatId},
                {"messages": {"$elemMatch": {"messageId": messageId}}}
            )
            if chat and "messages" in chat and chat["messages"]:
                return chat["messages"][0].get("layers", [])
            return []
        
    def addMessage(self, chatId: str, content: str, isUser: bool = True) -> str:
        """Adds a new message to a chat."""
        if not chatId:
            chatId = str(ObjectId())
        
        message: Message = {
            "messageId": str(ObjectId()),
            "user": "user" if isUser else "bot",
            "content": content,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "time": datetime.now().strftime("%H:%M:%S")
        }
        
        with self._getDbConnection():
            try:
                self.collection.update_one(
                    {"chatId": chatId},
                    {
                        "$push": {"messages": message},
                        "$setOnInsert": {
                            "date": datetime.now().strftime("%Y-%m-%d"),
                            "title": content[:30],
                            "pinned": False,
                            "archived": False,
                            "groupDetails": {
                                "groupName": "Default",
                                "groupColor": "gray"
                            }
                        },
                        "$set": {"lastUpdated": datetime.now()}
                    },
                    upsert=True
                )
            except Exception as e:
                logger.error(f"Error adding message to chat {chatId}: {e}")
                raise ChatHistoryError(f"Failed to add message: {str(e)}")
        
        return chatId
    
    def addLayers(self, chatId: str, messageId: str, layers: List[List[str]]) -> None:
        """Adds or updates layers for a specific message."""
        with self._getDbConnection():
            try:
                result = self.collection.update_one(
                    {
                        "chatId": chatId,
                        "messages.messageId": messageId
                    },
                    {
                        "$set": {
                            "messages.$.layers": layers,
                            "lastUpdated": datetime.now()
                        }
                    }
                )
                if result.matched_count == 0:
                    raise ChatHistoryError(f"No message found with ID: {messageId} in chat: {chatId}")
            except Exception as e:
                logger.error(f"Error adding layers for message {messageId} in chat {chatId}: {e}")
                raise ChatHistoryError(f"Failed to add layers: {str(e)}")

    def updateGroupStatus(self, chatId: str, groupName: str = 'CustomGroup', groupColor: str = 'red') -> None:
        """Updates the group status of a chat."""
        with self._getDbConnection():
            try:
                result = self.collection.update_one(
                    {"chatId": chatId},
                    {
                        "$set": {
                            "groupDetails": {
                                "groupName": groupName,
                                "groupColor": groupColor
                            },
                            "lastUpdated": datetime.now()
                        }
                    }
                )
                if result.matched_count == 0:
                    raise ChatHistoryError(f"No chat found with ID: {chatId}")
            except Exception as e:
                logger.error(f"Error updating group status for chat {chatId}: {e}")
                raise ChatHistoryError(f"Failed to update group status: {str(e)}")
    
    def updateChatTitle(self, chatId: str, newTitle: str) -> None:
        """Updates the title of a chat."""
        with self._getDbConnection():
            try:
                result = self.collection.update_one(
                    {"chatId": chatId},
                    {"$set": {"title": newTitle, "lastUpdated": datetime.now()}}
                )
                if result.matched_count == 0:
                    raise ChatHistoryError(f"No chat found with ID: {chatId}")
            except Exception as e:
                logger.error(f"Error updating title for chat {chatId}: {e}")
                raise ChatHistoryError(f"Failed to update chat title: {str(e)}")
    
    def updateMessage(self, chatId: str, messageId: str, newContent: str) -> None:
        """
        Updates the content of a message with the given messageID.
        Also updates the chat history of the given chatId: All the messages after this message are discarded (Deleted).
        """
        with self._getDbConnection():
            try:
                chat = self.collection.find_one({"chatId": chatId})
                if chat and "messages" in chat:
                    indexToPrune = None

                    for i, message in enumerate(chat["messages"]):
                        if message["messageId"] == messageId:
                            message["content"] = newContent
                            indexToPrune = i + 1
                            break

                    if indexToPrune is not None:
                        chat["messages"] = chat["messages"][:indexToPrune]
                        self.collection.update_one(
                            {"chatId": chatId},
                            {"$set": {"messages": chat["messages"], "lastUpdated": datetime.now()}}
                        )
                    else:
                        raise ChatHistoryError(f"No message found with ID: {messageId} in chat: {chatId}")
                else:
                    raise ChatHistoryError(f"No chat found with ID: {chatId}")
            except Exception as e:
                logger.error(f"Error updating message {messageId} in chat {chatId}: {e}")
                raise ChatHistoryError(f"Failed to update message: {str(e)}")

    def uploadDoc(self, chatId: str, file: bytes, filename: str, fileType: str) -> str:
        """Uploads a document and associate it with a chat."""
        if fileType not in ["csv", "pdf", "txt"]:
            raise ValueError("Unsupported file type. Only CSV, PDF, and TXT are allowed.")
        
        isReadable, message = self._checkDocumentReadability(file, fileType)
        if not isReadable:
            raise ValueError(message)
        
        with self._getDbConnection():
            try:
                fileId = self.fs.put(file, filename=filename, content_type=f"application/{fileType}")

                docInfo = {
                    "docId": str(fileId),
                    "filename": filename,
                    "fileType": fileType,
                    "uploadDate": datetime.now()
                }

                self.collection.update_one(
                    {"chatId": chatId},
                    {
                        "$push": {"documents": docInfo},
                        "$set": {"lastUpdated": datetime.now()}
                    },
                    upsert=True
                )
            except Exception as e:
                logger.error(f"Error uploading document for chat {chatId}: {e}")
                raise ChatHistoryError(f"Failed to upload document: {str(e)}")

        return str(fileId)

    def deleteChat(self, chatId: str) -> None:
        """Delete a chat and its associated documents."""
        with self._getDbConnection():
            try:
                chat = self.collection.find_one({"chatId": chatId})
                if chat and "documents" in chat:
                    for doc in chat["documents"]:
                        self.fs.delete(ObjectId(doc["docId"]))
                
                self.collection.delete_one({"chatId": chatId})
            except Exception as e:
                logger.error(f"Error deleting chat {chatId}: {e}")
                raise ChatHistoryError(f"Failed to delete chat: {str(e)}")
            
    def deleteDocument(self, chatId: str, docId: str) -> None:
        """Deletes a document from a chat and removes it from GridFS."""
        with self._getDbConnection():
            try:
                result = self.collection.update_one(
                    {"chatId": chatId},
                    {
                        "$pull": {"documents": {"docId": docId}},
                        "$set": {"lastUpdated": datetime.now()}
                    }
                )

                if result.matched_count == 0:
                    raise ChatHistoryError(f"No chat found with ID: {chatId}")

                if result.modified_count == 0:
                    raise ChatHistoryError(f"No document found with ID: {docId} in chat: {chatId}")
                self.fs.delete(ObjectId(docId))

            except Exception as e:
                logger.error(f"Error deleting document {docId} from chat {chatId}: {e}")
                raise ChatHistoryError(f"Failed to delete document: {str(e)}")

    def archiveChat(self, chatId: str) -> None:
        """Archives a chat."""
        self._updateChatStatus(chatId, "archived", True)

    def unarchiveChat(self, chatId: str) -> None:
        """Unarchives a chat."""
        self._updateChatStatus(chatId, "archived", False)

    def pinChat(self, chatId: str) -> None:
        """Pins a chat."""
        self._updateChatStatus(chatId, "pinned", True)

    def unpinChat(self, chatId: str) -> None:
        """Unpins a chat."""
        self._updateChatStatus(chatId, "pinned", False)

    def _updateChatStatus(self, chatId: str, field: str, value: bool) -> None:
        """Updates a status field of a chat."""
        with self._getDbConnection():
            try:
                self.collection.update_one(
                    {"chatId": chatId},
                    {"$set": {field: value}}
                )
            except Exception as e:
                logger.error(f"Error updating {field} status for chat {chatId}: {e}")
                raise ChatHistoryError(f"Failed to update chat status: {str(e)}")

    def searchChats(self, term: str) -> List[ChatDocument]:
        """Searches for chats containing a specific term."""
        with self._getDbConnection():
            try:
                self._ensureTextIndex()
                results = list(self.collection.find(
                    {"$text": {"$search": term}},
                    {"score": {"$meta": "textScore"}, "messages": 0}
                ).sort([("score", {"$meta": "textScore"})]))
                
                return [self._convertObjectId(result) for result in results]
            except Exception as e:
                logger.error(f"Error searching chats for term '{term}': {e}")
                raise ChatHistoryError(f"Failed to search chats: {str(e)}")

class ResourceManager:
    def __init__(self):
        self.client = MongoClient(os.getenv('MONGODB_URI'))
        self.db = self.client['Resources']
        self.resourcesPath = recourcesPath
        self.skipFileNames = ['.ENV']
        self.skipFileExtensions = ['.xlsx', '.xls', '.md']

    def createMetadata(self):
        regionsData = self._loadJson('regions.json')
        regionsDict = self._createRegionsMetadata(regionsData)
        self._saveJson(regionsDict, 'metadataRegions.json')
        
        datasetsData = self._loadJson('datasets.json')
        datasetsDict = self._createDatasetsMetadata(datasetsData)
        self._saveJson(datasetsDict, 'metadataDatasets.json')

    def _loadJson(self, filename):
        with open(os.path.join(self.resourcesPath, filename), 'r') as file:
            return json.load(file)

    def _saveJson(self, data, filename):
        with open(os.path.join(self.resourcesPath, filename), 'w') as file:
            json.dump(data, file, indent=2)

    def _createRegionsMetadata(self, regionsData):
        territoryDict = {
            'NSW': 'New South Wales', 'VIC': 'Victoria', 'QLD': 'Queensland',
            'WA': 'Western Australia', 'SA': 'South Australia', 'TAS': 'Tasmania',
            'ACT': 'Australian Capital Territory', 'NT': 'Northern Territory',
            'JBT': 'Jervis Bay Territory', 'NI': 'Norfolk Island',
            'CX': 'Christmas Island', 'CC': 'Cocos (Keeling) Islands'
        }
        regionsDict = {}
        for region in regionsData['regions']:
            regionId = region['id']
            territory = region['name'].split('/')[2]
            territoryName = territoryDict[territory]
            description = f"{region['display_name']} - Located in {territoryName} ({territory})"
            regionsDict[regionId] = description
        return regionsDict

    def _createDatasetsMetadata(self, datasetsData):
        datasetsDict = {}
        for dataset in datasetsData['datasets']:
            datasetId = dataset['id']
            sourceName = dataset['source']['name']
            description = dataset.get('description', '')
            level = dataset['level']
            seriesName = dataset['series_name']
            displayName = dataset['display_name']
            name = dataset['name']
            metadata = f"{displayName} - {description} Level: {level}. Source: {sourceName} ({name})."
            datasetsDict[datasetId] = metadata
        return datasetsDict

    def uploadToMongodb(self):
        for filename in os.listdir(self.resourcesPath):
            filePath = os.path.join(self.resourcesPath, filename)
            if os.path.isfile(filePath):
                self._uploadFile(filePath)

    def _uploadFile(self, filePath):
        fileName = os.path.basename(filePath)
        fileExtension = os.path.splitext(fileName)[1].lower()
        fileName = os.path.splitext(fileName)[0]

        if fileName in self.skipFileNames or fileExtension in self.skipFileExtensions:
            return
        

        with open(filePath, 'r', encoding='utf-8') as file:
            content = file.read()
        
        if fileName.lower().startswith('_archive'):
            collection = self.db['archive']
            fileName = fileName.replace('_archive_', '')
        elif fileName.lower().startswith('metadata'):
            collection = self.db['metadata']
            fileName = fileName.replace('metadata', '')
        else:
            collection = self.db[fileName]

        collection.insert_one({
            'name': fileName,
            'content': content
        })
    
    def processResources(self):
        self.createMetadata()
        self.uploadToMongodb()
        logger.info("All resources have been processed and uploaded to MongoDB.")

## For Testing Purposes
class QuerySQLTool2:
    """
    A tool for executing SQL queries on a database and processing the results.

    This class provides methods to execute SQL queries, parse the results,
    and convert them into pandas DataFrames. It includes custom parsing for
    special data types like Decimal, datetime, date, and handles 'inf' values.

    Attributes:
        db (SQLDatabase): The database connection object.
        queryRunner (QuerySQLDataBaseTool): The tool used to run SQL queries.

    Methods:
        executeQuery(query: str) -> pd.DataFrame:
            Execute an SQL query and return the results as a DataFrame.
        getCols(sqlQuery: str) -> List[str]:
            Extract column names from an SQL query.

    Private Methods:
        _parseDecimal(match): Parse Decimal values from query results.
        _parseDatetime(match): Parse datetime values from query results.
        _parseDate(match): Parse date values from query results.
        _customParser(resStr: str): Custom parser for query result strings.

    Raises:
        InvalidUserQueryException: If the query is invalid or unrelated to the database.
        NoDataFoundException: If no data is returned from the query.
    """
    def __init__(self, dbName: str):
        self.dbName = dbName
    
    @contextmanager
    def _getDbConnection(self):
        with loadPostgresDatabase(self.dbName) as db:
            yield db
    
    def _validateSqlQuery(self, query: str) -> bool:
        """
        Validates the SQL query for potential SQL injection.
        
        Args:
            query (str): The SQL query to validate.
        
        Returns:
            bool: True if the query is valid, False otherwise.
        """

        parsed = sqlparse.parse(query)
        if not parsed:
            return False
        
        if len(parsed) > 1:
            return False

        statement = parsed[0]
        if statement.get_type() not in ('SELECT', 'WITH'):
            return False
        
        def check_tokens(token_list):
            for token in token_list:
                if token.ttype is Keyword and token.value.upper() in ('INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER'):
                    return False
                if isinstance(token, IdentifierList) or isinstance(token, Identifier):
                    if not check_tokens(token.tokens):
                        return False
            return True
        
        if not check_tokens(statement.tokens):
            return False

        return True
    
    def _getCols(self, sqlQuery: str) -> List[str]:
        """
        Extracts column names from an SQL query.
        
        Args:
            sqlQuery (str): The SQL query.
        
        Returns:
            List[str]: A list of column names.
        """
        selectRegex = re.compile(r'select\s+(.+?)\s+from', re.IGNORECASE | re.DOTALL)
        allMatches = selectRegex.findall(sqlQuery)
        if not allMatches:
            return []
        finalSelect = allMatches[0]
        return [col.lower().strip().split(' as ')[-1].split('.')[-1] for col in finalSelect.split(',')]

    def _parseDecimal(self, match):
        value = match.group(1)
        if value.lower() == 'inf':
            return 'None'
        elif value.lower() == '-inf':
            return 'None'
        return f"'{Decimal(value)}'"

    def _parseDatetime(self, match):
        dateArgs = list(map(int, match.group(1).split(',')))
        if 'tzinfo' in match.group(2):
            dt = datetime(*dateArgs, tzinfo=timezone.utc)
        else:
            dt = datetime(*dateArgs)
        return f"'{dt.isoformat()}'"

    def _parseDate(self, match):
        dateArgs = list(map(int, match.group(1).split(',')))
        dt = date(*dateArgs)
        return f"'{dt.isoformat()}'"
    
    def _customParser(self, resStr: str):
        resStr = re.sub(
            r"Decimal\('([^']+)'\)"
            , self._parseDecimal
            , resStr
        )
        resStr = re.sub(
            r"datetime\.datetime\(([\d, ]+)(, tzinfo=datetime\.timezone\.utc)?\)"
            , self._parseDatetime
            , resStr
        )
        resStr = re.sub(
            r"datetime\.date\(([\d, ]+)\)"
            , self._parseDate
            , resStr
        )
        resStr = re.sub(r"inf", 'None', resStr)
        resStr = re.sub(r"-inf", 'None', resStr)
        return ast.literal_eval(resStr)
        
    def executeQuery(self, query: str) -> pd.DataFrame:
        """
        Executes an SQL query and return the results as a DataFrame.
        
        Args:
            query (str): The SQL query to execute.
        
        Returns:
            pd.DataFrame: The query results as a DataFrame.
        
        Raises:
            InvalidUserQueryException: If the query is invalid or unrelated to the database.
            NoDataFoundException: If no data is returned from the query.
        """
        with self._getDbConnection() as db:
            queryRunner = QuerySQLDataBaseTool(db=db)

            if query == "invalid user query - not related to the database.":
                raise InvalidUserQueryException("Query is not related to the database schema.")
            if not self._validateSqlQuery(query):
                raise InvalidUserQueryException("Invalid SQL query. Possible SQL injection attempt.")
            try:
                res = queryRunner.invoke(query)
                
                ## Testing START
                with open('preres.txt', 'w') as file:
                    file.write(str(res))
                res = self._customParser(res)
                
                with open('res.txt', 'w') as file:
                    file.write(str(res))
                ## Testing END

                if not res:
                    raise NoDataFoundException("No data fetched from the database")
                columns = self._getCols(query)          
                if not columns:
                    columns = range(len(res[0]))
                logger.info(f"Identified columns: {columns}")
                return pd.DataFrame.from_records(data=res, columns=columns)
            except SyntaxError as e:
                logger.error(f"Error executing SQL Query: {query}\nERROR:{e}\n")
                raise InvalidUserQueryException("Invalid SQL query.")
            except Exception as e:
                Data = res if res else 'Can Not Fetch Data'
                logger.error(f"Error executing query: {e}\nSQL Query: {query}\nData: {Data}")
                raise

## For Testing Purposes
class DataFetcher:
    def __init__(self):
        self.mongo_uri = os.environ.get('MONGO_URI')
        self.postgres_db_name = os.environ.get('POLIMAP_DB_NAME')
        self.mongo_client = MongoClient(self.mongo_uri)
        self.query_tool = QuerySQLTool2(dbName=self.postgres_db_name)

    @contextmanager
    def get_mongo_connection(self):
        db = self.mongo_client['appdata']
        try:
            yield db
        finally:
            pass  

    def fetch_dataset(self, id: int) -> Optional[Dict[str, Any]]:
        with self.get_mongo_connection() as db:
            dataset = db['datasets'].find_one({"id": id}, {"display_name": 1, "name": 1, "level": 1, "series_name": 1, "query": 1, "id": 1, "_id": 0})
        return dataset

    def fetch_region(self, regionId: int) -> Optional[Dict[str, Any]]:
        if regionId is None:
            return None
        with self.get_mongo_connection() as db:
            region = db['regions'].find_one({"id": regionId}, {"display_name": 1, "id": 1,  "aec_id": 1, "series_name": 1, "query": 1, "_id": 0})
        return region

    def fetch_data(self, dataset: Dict[str, Any], region: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if dataset["query"]['query_type'].upper() == "SQL":
            return self.fetch_sql_data(dataset, region)
        elif dataset["query"]['query_type'].upper() == "ELECDATA":
            return self.fetch_elec_data(dataset, region)
        else:
            raise ValueError(f"Unsupported query type: {dataset['query']['query_type']}")

    def fetch_sql_data(self, dataset: Dict[str, Any], region: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        sql_query = dataset["query"]['query_text']
        if region:
            sql_query += " " + dataset["query"]['filter']
            sql_query = sql_query.replace("%s", f"'{region['display_name']}'")

        logger.info(f"Executing SQL Query: {sql_query}")
        polimapData = self.query_tool.executeQuery(sql_query)
        return polimapData

    def fetch_elec_data(self, dataset: Dict[str, Any], region: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        filter = {}
        if region:
            filter = dataset["query"]["filter"]
            for k, v in filter['places'].items():
                if filter['places'][k] == "%s":
                    filter['places'][k] = [region["display_name"]]

        # Simulated column_data structure
        column_data = {
            'series': [
                {'name': 'locale_id', 'data': []},
                {'name': 'seat', 'data': []},
                {'name': dataset['series_name'], 'data': []},
                {'name': 'year', 'data': []},
                {'name': 'place', 'data': []}
            ]
        }

        series = [x for x in column_data['series'] if x['name'] in ['percent', 'year', 'place']]
        for col in series:
            if col['name'] == "percent":
                col['name'] = dataset['series_name']
        column_data['series'] = series

        return {'layers': [column_data]}

    def get_datasets_with_data(self, layers: List[List[str]]) -> List[Dict[str, Any]]:
        results = []
        logger.info(f"input layers: {layers}")
        for layer in layers:
            logger.info(f"processing layer:{layer}")
            if len(layer) != 3:
                raise ValueError("Each layer must contain exactly three elements: [RegionID, DatasetID, Level].")
            region_id, dataset_id, level = layer

            dataset = self.fetch_dataset(int(dataset_id))
            if dataset is None:
                raise ValueError(f"Dataset {dataset_id} not found")
            
            if region_id != '':
                region = self.fetch_region(int(region_id))
                if region is None:
                    raise ValueError(f"Region {region_id} not found")
            else:
                region = None
            
            logger.info(f"fetching data for {dataset} and {region}")
            sqlData = self.fetch_data(dataset, region)
            dataset_copy = dataset.copy()
            dataset_copy['data'] = sqlData
            del dataset_copy['query']
            results.append(dataset_copy)


        return results