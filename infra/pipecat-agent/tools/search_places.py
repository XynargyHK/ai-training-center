"""
Search Places Tool — find places and open Google Maps.
Pipecat-local: opens Maps URL in browser.
"""
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams

schema = FunctionSchema(
    name="search_places",
    description="Search for nearby places, restaurants, hotels, shops, attractions. Opens Google Maps. Use when user says 'find a restaurant', 'where is the nearest pharmacy', 'show me hotels near X'.",
    properties={
        "query": {"type": "string", "description": "What to search for, e.g. 'sushi restaurant near Causeway Bay'"},
    },
    required=["query"],
)


def create_handler(transport):
    async def handle(params: FunctionCallParams):
        from pipecat.transports.daily.transport import DailyOutputTransportMessageFrame
        query = params.arguments.get("query", "")
        maps_url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
        logger.info(f"Search places: {query} -> {maps_url}")
        try:
            await transport.output().send_message(DailyOutputTransportMessageFrame(message={"type": "open-url", "url": maps_url}))
        except Exception as e:
            logger.error(f"Could not open maps: {e}")
        await params.result_callback({"status": "opened", "maps_url": maps_url, "query": query})
    return handle


def register(llm, transport):
    llm.register_function("search_places", create_handler(transport))
