"""
Search Places Tool — find places and open map (Google/Baidu/Amap).
Pipecat-local: opens map URL in browser.
Set MAP_PROVIDER=baidu or MAP_PROVIDER=amap for China.
"""
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams
from parts.maps_url import search_url

schema = FunctionSchema(
    name="search_places",
    description="Search for nearby places, restaurants, hotels, shops, attractions. Opens the map. Use when user says 'find a restaurant', 'where is the nearest pharmacy', 'show me hotels near X'.",
    properties={
        "query": {"type": "string", "description": "What to search for, e.g. 'sushi restaurant near Causeway Bay'"},
    },
    required=["query"],
)


def create_handler(transport):
    async def handle(params: FunctionCallParams):
        from pipecat.transports.livekit.transport import LiveKitOutputTransportMessageFrame
        query = params.arguments.get("query", "")
        result = search_url(query)
        logger.info(f"Search places ({result['provider']}): {query} -> {result['url']}")
        try:
            await transport.output().send_message(LiveKitOutputTransportMessageFrame(message={"type": "open-url", "url": result["url"]}))
        except Exception as e:
            logger.error(f"Could not open maps: {e}")
        await params.result_callback({"status": "opened", "maps_url": result["url"], "provider": result["provider"], "query": query})
    return handle


def register(llm, transport):
    llm.register_function("search_places", create_handler(transport))
