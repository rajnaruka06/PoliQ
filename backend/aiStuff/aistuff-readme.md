# AI Stuff

This directory contains the core AI and data processing logic for our electoral data analysis application.

## Files

- `agentHelpers.py`: Utility functions and classes for database operations, chat history management, and query processing.
- `customAgents.py`: Custom AI agents for SQL query generation, response summarization, and dataset-region matching.
- `workflows.py`: Main workflow for processing user queries and generating responses.

## Key Components

### AgentHelpers

- `QuerySQLTool`: Executes SQL queries on the database
- `ChatHistory`: Manages user chat history and document storage
  - Supports document upload and management (CSV, PDF, TXT)
  - Handles chat operations: pin, unpin, archive, unarchive, delete
  - Manages messages: add, update, retrieve
  - Supports group status updates
  - Implements search functionality
- `loadPostgresDatabase`: Context manager for database connections
- `loadLLM`: Loads the specified language model
- `ResourceManager`: Manages metadata and resources for the application

### CustomAgents

- `SqlExpert`: Generates and refines SQL queries based on user input
- `ResponseSummarizer`: Summarizes query results with self-reflection
- `ChatAgent`: Handles general conversation
- `RouterAgent`: Determines query type (database or chat)
- `DatasetRegionMatcherAgent`: Matches user queries to relevant datasets and regions (Not yet being used in the frontend)

### Workflows

- `ElecDataWorkflow`: Orchestrates the entire process of handling user queries, generating SQL, executing queries, and summarizing results
- `DatasetRegionMatcher`: Manages the process of matching datasets and regions to user queries (Not yet being used in the frontend)

## New Features

- Document upload and management for CSV, PDF, and TXT files
- Chat grouping functionality
- Message updating with chat history pruning
- Enhanced error handling with custom exceptions
- Token management for recent messages
- Improved metadata handling and resource management
- Dataset and region matching for user queries

## Usage

These components are primarily used by the FastAPI application in the `/api` directory. They are not intended to be used directly but rather as part of the larger application workflow.

## Integration with Other Components

- Works closely with the FastAPI application in the `/api` directory
- Utilizes environment variables from the `/resources/.ENV` file
- Interacts with both PostgreSQL and MongoDB databases

## Testing

For testing the metadata automation and other components, refer to the test files in the `/tests` directory.