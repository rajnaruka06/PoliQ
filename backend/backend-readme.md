# Backend

This is the backend service for our electoral data analysis application. It provides a FastAPI-based API for querying and analyzing electoral data, as well as managing chat history and user interactions.

## Directory Structure

- `/aiStuff`: Contains core AI and data processing logic
- `/api`: Contains the FastAPI application
- `/resources`: Contains configuration files and environment variables

## Setup

1. Ensure you have Python 3.8+ installed (preferably 3.12)
2. Install dependencies: `pip install -r requirements.txt`
3. Set up your environment variables in `/resources/.ENV`
4. Run the application: `uvicorn api.main:app --reload`

## Key Components

- ElecDataWorkflow: Handles electoral data queries and processing
- ChatHistory: Manages user chat history and document storage
- FastAPI application: Provides RESTful API endpoints for the frontend
- CustomAgents: Includes SqlExpert, ResponseSummarizer, ChatAgent, and RouterAgent

## New Features

1. Document Upload and Management:
   - Support for CSV, PDF, and TXT file uploads
   - Document readability checks
   - Document content extraction for LLM processing

2. Enhanced Chat Management:
   - Group status updates (name and color)
   - Chat title updates
   - Message updating with chat history pruning

3. Improved Error Handling:
   - Custom exceptions for various error scenarios

4. AI Agents:
   - ChatAgent for general conversation
   - RouterAgent for determining query type (database or chat)

5. Token Management:
   - Implemented token counting and limiting for recent messages

6. Extended API Endpoints:
   - File upload
   - Group status update
   - Chat title update
   - Message update

## Usage

The backend provides a comprehensive API for managing chats, processing queries, and handling document uploads. Refer to the API documentation for detailed endpoint information.

For more details on each component, please refer to the README files in each subdirectory.