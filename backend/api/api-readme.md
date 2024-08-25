# API

This directory contains the FastAPI application that serves as the backend API for our electoral data analysis application.

## Files

- `main.py`: The main FastAPI application file containing all API routes and logic.

## Key Features

- RESTful API endpoints for:
  - Fetching chat history
  - Sending messages and processing queries
  - Managing chats (pin, unpin, delete, archive, unarchive)
  - Searching chats
  - Updating chat titles and messages

## API Routes

- GET `/api/chats/all`: Fetch all chats for a user
- GET `/api/chats/{chatId}/messages`: Fetch messages for a specific chat
- POST `/api/messages/send`: Send a new message and get a response
- PUT `/api/chats/{chatId}/pin`: Pin a chat
- PUT `/api/chats/{chatId}/unpin`: Unpin a chat
- DELETE `/api/chats/{chatId}/delete`: Delete a chat
- PUT `/api/chats/{chatId}/archive`: Archive a chat
- PUT `/api/chats/{chatId}/unarchive`: Unarchive a chat
- GET `/api/chats/search`: Search chats
- PUT `/api/chats/{chatId}/title`: Update chat title
- GET `/api/chats/{chatId}/messages/{messageId}`: Get a specific message
- PUT `/api/chats/{chatId}/messages/{messageId}`: Update a specific message

## Usage

To run the FastAPI application:

```
uvicorn api.main:app --reload
```

This will start the server, and you can access the API documentation at `http://localhost:8000/docs`.
