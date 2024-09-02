## main.py

from fastapi import FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import sys
import os
from typing import List, Optional

## Adding the parent directory to the sys path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from aiStuff.workflows import ElecDataWorkflow
from aiStuff.agentHelpers import ChatHistory, ChatHistoryError

## Setting up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

## Initializing the FastAPI app
app = FastAPI()

## Adding CORS middleware
origins = os.getenv("CORS_ORIGINS").split(',')
origins = [origin.strip() for origin in origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

## Initializing the workflow
workflow = ElecDataWorkflow()

class MessageRequest(BaseModel):
    chatId: Optional[str]
    content: str

class QueryRequest(BaseModel):
    userQuery: str
    chatId: Optional[str]

@app.get("/api/chats/all")
async def fetchChatHistory(userId: str = Query(...)):
    try:
        chatHistory = ChatHistory(userId=userId)
        history = chatHistory.getAllChats()
        return history
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chats/{chatId}/messages")
async def fetchMessages(chatId: str = Path(...), userId: str = Query(...)):
    try:
        chatHistory = ChatHistory(userId=userId)
        messages = chatHistory.getMessages(chatId)
        return messages
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/messages/send")
async def handleSend(message: MessageRequest, userId: str = Query(...)):
    try:
        chatHistory = ChatHistory(userId=userId)
        chatId = chatHistory.addMessage(message.chatId, message.content)
        fetchedContext = chatHistory.getRecentMessages(chatId)
        context = ''
        for hist in fetchedContext[:-1]:
            context += f"{hist['user']}: {hist['content']}\n"
        response = workflow.processUserQuery(message.content, context)
        _ = chatHistory.addMessage(chatId, response, isUser=False)
        return {"status": "Message sent and processed", "chatId": chatId}
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/chats/{chatId}/latest")
async def getLatestMessages(chatId: str = Path(...), userId: str = Query(...), limit: int = Query(default=2)):
    try:
        chatHistory = ChatHistory(userId=userId)
        messages = chatHistory.getRecentMessages(chatId)
        messages = messages[-limit:]
        return {"messages": messages}
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/chats/{chatId}/pin")
async def handlePinChat(chatId: str = Path(...), userId: str = Query(...)):
    try:
        chatHistory = ChatHistory(userId=userId)
        chatHistory.pinChat(chatId)
        return {"status": "Chat pin status updated"}
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/chats/{chatId}/unpin")
async def handleUnpinChat(chatId: str = Path(...), userId: str = Query(...)):
    try:
        chatHistory = ChatHistory(userId=userId)
        chatHistory.unpinChat(chatId)
        return {"status": "Chat pin status updated"}
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/chats/{chatId}/delete")
async def handleDeleteChat(chatId: str = Path(...), userId: str = Query(...)):
    try:
        chatHistory = ChatHistory(userId=userId)
        chatHistory.deleteChat(chatId)
        return {"status": "Chat deleted successfully"}
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/chats/{chatId}/archive")
async def handleArchiveChat(chatId: str = Path(...), userId: str = Query(...)):
    try:
        chatHistory = ChatHistory(userId=userId)
        chatHistory.archiveChat(chatId)
        return {"status": "Chat archived successfully"}
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/chats/{chatId}/unarchive")
async def handleUnarchiveChat(chatId: str = Path(...), userId: str = Query(...)):
    try:
        chatHistory = ChatHistory(userId=userId)
        chatHistory.unarchiveChat(chatId)
        return {"status": "Chat unarchived successfully"}
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chats/search")
async def handleSearch(term: str = Query(...), userId: str = Query(...)):
    try:
        chatHistory = ChatHistory(userId=userId)
        searchResults = chatHistory.searchChats(term)
        return searchResults
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/chats/{chatId}/title")
async def handleUpdateChatTitle(chatId: str = Path(...), userId: str = Query(...), newTitle: str = Query(...)):
    try:
        chatHistory = ChatHistory(userId=userId)
        chatHistory.updateChatTitle(chatId, newTitle)
        return {"status": "Chat title updated successfully"}
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/chats/{chatId}/messages/{messageId}")
async def copyMessage(chatId: str = Path(...), messageId: str = Path(...), userId: str = Query(...)):
    try:
        chatHistory = ChatHistory(userId=userId)
        message = chatHistory.getMessage(chatId, messageId)
        return {"content": message["content"]}
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/chats/{chatId}/messages/{messageId}")
async def handleUpdateMessage(chatId: str = Path(...), messageId: str = Path(...), newContent: str = Query(...), userId: str = Query(...)):
    try:
        chatHistory = ChatHistory(userId=userId)
        chatHistory.updateMessage(chatId, messageId, newContent)
        fetchedContext = chatHistory.getRecentMessages(chatId)
        context = ''
        for hist in fetchedContext[:-1]:
            context += f"{hist['user']}: {hist['content']}\n"
        response = workflow.processUserQuery(newContent, context)
        chatHistory.addMessage(chatId, response, isUser=False)
        return {"status": "Message updated and new response generated"}
    except ChatHistoryError as e:
        raise HTTPException(status_code=500, detail=str(e))