from fastapi import FastAPI, HTTPException
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

class QueryRequest(BaseModel):
    user_query: str

class SQLQueryRequest(BaseModel):
    sql_query: str



@app.post("/run")
async def run(request: QueryRequest):
    logger.info(f"Received request: {request.user_query}")
    try:
        response = workflow.run(request.user_query)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))