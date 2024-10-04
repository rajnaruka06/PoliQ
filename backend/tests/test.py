import json
from typing import Dict, Any, Optional
from langchain_core.prompts import PromptTemplate
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from aiStuff.agentHelpers import loadLLM
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text
from contextlib import asynccontextmanager
import os
import sys

sys.path.append(os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(dotenv_path='./resources/.ENV')

import asyncio
import aiohttp
from aiStuff.workflows import DatasetRegionMatcher
from aiStuff.agentHelpers import DataFetcher

async def fetch_data(session, dataset_id, region_id):
    url = f"http://localhost:8000/datasets/{dataset_id}/region/{region_id}/level/CED"
    async with session.get(url) as response:
        return await response.json()

async def process_query(user_query: str):
    # Initialize DatasetRegionMatcher
    matcher = DatasetRegionMatcher()

    # Get region ID and dataset IDs
    match_result = matcher.match(user_query)
    region_id = match_result.get('region')
    dataset_ids = match_result.get('dataset', [])

    if not dataset_ids:
        print("No relevant datasets found for the query.")
        return

    # Fetch data for each dataset using the FastAPI endpoint
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_data(session, dataset_id, region_id) for dataset_id in dataset_ids]
        results = await asyncio.gather(*tasks)

    # Print results
    for dataset_id, result in zip(dataset_ids, results):
        print(f"Dataset ID: {dataset_id}")
        print(f"Data: {result}")
        print("-" * 50)

# Example usage
async def main():
    user_query = "Where do the renters live in Wills?"
    await process_query(user_query)

if __name__ == "__main__":
    asyncio.run(main())
