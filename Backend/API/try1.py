from fastapi import FastAPI
from pydantic import BaseModel
from AI_Stuff.Workflows import elecdataworkflow
import uvicorn

app = FastAPI()

class QueryRequest(BaseModel):
    user_query: str

@app.post("/query")
async def handle_query(query_request: QueryRequest):
    workflow = elecdataworkflow()
    response = workflow.run(query_request.user_query)
    return {"response": response}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)