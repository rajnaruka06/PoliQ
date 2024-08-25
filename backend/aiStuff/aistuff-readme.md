# AI Stuff

This directory contains the core AI and data processing logic for our electoral data analysis application.

## Files

- `agentHelpers.py`: Utility functions and classes for database operations, chat history management, and query processing.
- `customAgents.py`: Custom AI agents for SQL query generation and response summarization.
- `workflows.py`: Main workflow for processing user queries and generating responses.

## Key Components

### AgentHelpers

- `QuerySQLTool`: Executes SQL queries on the database
- `ChatHistory`: Manages user chat history and document storage
- `loadPostgresDatabase`: Context manager for database connections
- `loadLLM`: Loads the specified language model

### CustomAgents

- `SqlExpert`: Generates and refines SQL queries based on user input
- `ResponseSummarizer`: Summarizes query results with self-reflection

### Workflows

- `ElecDataWorkflow`: Orchestrates the entire process of handling user queries, generating SQL, executing queries, and summarizing results

## Usage

These components are primarily used by the FastAPI application in the `/api` directory. They are not intended to be used directly but rather as part of the larger application workflow.
