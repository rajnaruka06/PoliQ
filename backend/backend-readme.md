# Backend

This is the backend service for our electoral data analysis application. It provides a FastAPI-based API for querying and analyzing electoral data, as well as managing chat history and user interactions.

## Directory Structure

- `/aiStuff`: Contains core AI and data processing logic
- `/api`: Contains the FastAPI application
- `/resources`: Contains configuration files and environment variables

## Setup

1. Ensure you have Python 3.8+ installed (preferrably 3.12)
2. Install dependencies: `pip install -r requirements.txt`
3. Set up your environment variables in `/resources/.ENV`
4. Run the application: `uvicorn api.main:app --reload`

## Key Components

- ElecDataWorkflow: Handles electoral data queries and processing
- ChatHistory: Manages user chat history and document storage
- FastAPI application: Provides RESTful API endpoints for the frontend

For more details on each component, please refer to the README files in each subdirectory.
