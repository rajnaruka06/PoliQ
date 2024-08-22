from fastapi import FastAPI, HTTPException
#PMJ 22/8/2024: imported CORS to allow cross origin resource sharing between 5173 and 8000
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel
import logging
import sys
import os


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from AI_Stuff.Workflows import elecdataworkflow
workflow = elecdataworkflow()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

#PMJ 22/8/2024: Adding CORS middleware to allow requests from 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], #PMJ 22/8/2024: explicitly states frontend URL as a header
    allow_credentials=True,
    allow_methods=["POST"], #PMJ 22/8/2024: explicitly allows a POST method from the frontend URL, can add GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD
    allow_headers=["*"], # PMG 22/8/2024: this allows all headers but this is not a good practice, must change it later
)

class QueryRequest(BaseModel):
    user_query: str

class SQLQueryRequest(BaseModel):
    sql_query: str



# @app.post("/run")
# async def run(request: QueryRequest):
#     logger.info(f"Received request: {request.user_query}")
#     return request
#     try:
#         response = workflow.run(request.user_query)
#         return {"response": response}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#PMJ 22/8/2024: This sends a response back to the front end with some hardcoded words then reflects the query back to the user.
@app.post("/run")
async def run(request: QueryRequest):
    logger.info(f"Received request: {request.user_query}")
    try:
        # Modify the response to add the custom backend text
        response = f"This is the backend speaking, this is what you said: {request.user_query}"
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))