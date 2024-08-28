from fastapi import FastAPI, HTTPException, Path, Query
from pydantic import BaseModel
#PMJ 23/8/2024: imported CORS to allow cross origin resource sharing between 5173 and 8000
from fastapi.middleware.cors import CORSMiddleware 
import logging
import sys
import os
from typing import List, Optional

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from AI_Stuff.Workflows import elecdataworkflow
from AI_Stuff.Agent_Helpers import ChatHistory
workflow = elecdataworkflow()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

#PMJ 23/8/2024: Adding CORS middleware to allow requests from 5173, same as in try1.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

class MessageRequest(BaseModel):
    chat_id: Optional[str]
    content: str

class QueryRequest(BaseModel):
    user_query: str
    chat_id: Optional[str]

# fetches all chat history
@app.get("/api/chats/all")
async def fetch_chat_history(user_id: str = Query(...)):
    try:
        chat_history = ChatHistory(user_id=user_id)
        history = chat_history.get_all_chats()
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# fetches messages for a specific chat according to the chat_ID
@app.get("/api/chats/{chat_id}/messages")
async def fetch_messages(chat_id: str = Path(...), user_id: str = Query(...)):
    try:
        chat_history = ChatHistory(user_id=user_id)
        messages = chat_history.get_messages(chat_id)
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# sends a message and gets a response
@app.post("/api/messages/send")
async def handle_send(message: MessageRequest, user_id: str = Query(...)):
    try:
        chat_history = ChatHistory(user_id=user_id)
        chat_id = chat_history.add_message(message.chat_id, message.content)
        workflow = elecdataworkflow()
        context = ''
        # fetched_context = await fetch_messages(chat_id, user_id)
        fetched_context = chat_history.get_recent_messages(chat_id)
        fetched_context = fetched_context[:-1]
        for hist in fetched_context:
            context += f"{hist['user']}: {hist['content']}\n"

        response = workflow.run(message.content, context)
        chat_id = chat_history.add_message(chat_id, response, is_user=False)
        return {"response": response, "chat_id": chat_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# pins a chat
@app.put("/api/chats/{chat_id}/pin")
async def handle_pin_chat(chat_id: str = Path(...), user_id: str = Query(...)):
    try:
        chat_history = ChatHistory(user_id=user_id)
        chat_history.pin_chat(chat_id)
        return {"status": "Chat pin status updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# unpins a chat
@app.put("/api/chats/{chat_id}/unpin")
async def handle_unpin_chat(chat_id: str = Path(...), user_id: str = Query(...)):
    try:
        chat_history = ChatHistory(user_id=user_id)
        chat_history.unpin_chat(chat_id)
        return {"status": "Chat pin status updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# deletes a chat
@app.delete("/api/chats/{chat_id}/delete")
async def handle_delete_chat(chat_id: str = Path(...), user_id: str = Query(...)):
    try:
        chat_history = ChatHistory(user_id=user_id)
        chat_history.delete_chat(chat_id)
        return {"status": "Chat deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# archives a chat
@app.put("/api/chats/{chat_id}/archive")
async def handle_archive_chat(chat_id: str = Path(...), user_id: str = Query(...)):
    try:
        chat_history = ChatHistory(user_id=user_id)
        chat_history.archive_chat(chat_id)
        return {"status": "Chat archived successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# searches through the chats in chat history
@app.get("/api/chats/search")
async def handle_search(term: str = Query(...), user_id: str = Query(...)):
    try:
        chat_history = ChatHistory(user_id=user_id)
        search_results = chat_history.search_chats(term)
        return search_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))