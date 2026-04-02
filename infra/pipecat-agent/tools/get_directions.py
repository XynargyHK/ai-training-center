"""
Get Directions Tool — opens map directions (Google/Baidu/Amap).
Pipecat-local: opens map URL in browser.
Set MAP_PROVIDER=baidu or MAP_PROVIDER=amap for China.
"""
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams
from parts.maps_url import directions_url

schema = FunctionSchema(
    name="get_directions",
    description="Get directions between two locations. Opens the map. Use when user says 'how to get from A to B', 'directions to the airport', 'navigate to X'.",
    properties={
        "origin": {"type": "string", "description": "Starting location"},
        "destination": {"type": "string", "description": "Destination location"},
        "mode": {"type": "string", "description": "Travel mode: driving, transit, walking, bicycling. Default: transit"},
    },
    required=["origin", "destination"],
)


def create_handler(transport):
    async def handle(params: FunctionCallParams):
        from pipecat.transports.daily.transport import DailyOutputTransportMessageFrame
        origin = params.arguments.get("origin", "")
        destination = params.arguments.get("destination", "")
        mode = params.arguments.get("mode", "transit")
        result = directions_url(origin, destination, mode)
        logger.info(f"Directions ({result['provider']}): {origin} -> {destination} ({mode})")
        try:
            await transport.output().send_message(DailyOutputTransportMessageFrame(message={"type": "open-url", "url": result["url"]}))
        except Exception as e:
            logger.error(f"Could not open maps: {e}")
        await params.result_callback({"status": "opened", "maps_url": result["url"], "provider": result["provider"], "mode": mode})
    return handle


def register(llm, transport):
    llm.register_function("get_directions", create_handler(transport))
