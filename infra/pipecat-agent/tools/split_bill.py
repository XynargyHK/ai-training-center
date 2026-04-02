"""
Split Bill Tool — delegates to Brain.
Input: total, num_people, currency, tip_percent, tax_percent
Output: per_person amount, summary
"""
import os
import aiohttp
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams

BRAIN_URL = os.getenv("BRAIN_URL", "http://localhost:8000")

schema = FunctionSchema(
    name="split_bill",
    description="Calculate bill splitting for a group. Use when user says 'split the bill', 'how much each person owes', 'divide 500 by 4 people'.",
    properties={
        "total": {
            "type": "number",
            "description": "Total bill amount"
        },
        "num_people": {
            "type": "number",
            "description": "Number of people to split between"
        },
        "currency": {
            "type": "string",
            "description": "Currency code, e.g. HKD, CNY, USD. Default: HKD"
        },
        "tip_percent": {
            "type": "number",
            "description": "Tip percentage. Default: 0"
        },
    },
    required=["total", "num_people"],
)


def create_handler():
    async def handle(params: FunctionCallParams):
        total = params.arguments.get("total", 0)
        num_people = params.arguments.get("num_people", 2)
        currency = params.arguments.get("currency", "HKD")
        tip = params.arguments.get("tip_percent", 0)
        logger.info(f"Delegating split_bill to Brain: {total} / {num_people}")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{BRAIN_URL}/execute",
                    json={
                        "function_name": "split_bill",
                        "arguments": {"total": total, "num_people": num_people, "currency": currency, "tip_percent": tip},
                    },
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    data = await resp.json()
                    await params.result_callback(data.get("result", data))
        except Exception as e:
            logger.error(f"Brain split_bill failed: {e}")
            await params.result_callback({"status": "failed", "error": str(e)})
    return handle


def register(llm):
    llm.register_function("split_bill", create_handler())
