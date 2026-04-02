"""
Search Web Tool — delegates to Brain.
Brain executes the actual DuckDuckGo search.
"""
import os
import aiohttp
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams

BRAIN_URL = os.getenv("BRAIN_URL", "http://localhost:8000")

schema = FunctionSchema(
    name="search_web",
    description="Search the web and return results. Use when user asks for current info like prices, news, weather, facts, research, restaurants, places, etc.",
    properties={
        "query": {"type": "string", "description": "The search query"}
    },
    required=["query"],
)


def create_handler():
    async def handle(params: FunctionCallParams):
        query = params.arguments.get("query", "")
        logger.info(f"Delegating search_web to Brain: {query}")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{BRAIN_URL}/execute",
                    json={"function_name": "search_web", "arguments": {"query": query}},
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    data = await resp.json()
                    await params.result_callback(data.get("result", data))
        except Exception as e:
            logger.error(f"Brain search_web failed: {e}")
            await params.result_callback({"error": str(e), "query": query})
    return handle


def register(llm):
    llm.register_function("search_web", create_handler())
