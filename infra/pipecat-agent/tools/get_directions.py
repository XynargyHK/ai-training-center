"""
Get Directions Tool — opens Google Maps directions.
Pipecat-local: opens Maps URL in browser.
"""
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams

schema = FunctionSchema(
    name="get_directions",
    description="Get directions between two locations. Opens Google Maps. Use when user says 'how to get from A to B', 'directions to the airport', 'navigate to X'.",
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
        origin = params.arguments.get("origin", "").replace(" ", "+")
        destination = params.arguments.get("destination", "").replace(" ", "+")
        mode = params.arguments.get("mode", "transit")
        maps_url = f"https://www.google.com/maps/dir/{origin}/{destination}/@?travelmode={mode}"
        logger.info(f"Directions: {origin} -> {destination} ({mode})")
        try:
            await transport.output().send_message(DailyOutputTransportMessageFrame(message={"type": "open-url", "url": maps_url}))
        except Exception as e:
            logger.error(f"Could not open maps: {e}")
        await params.result_callback({"status": "opened", "maps_url": maps_url, "mode": mode})
    return handle


def register(llm, transport):
    llm.register_function("get_directions", create_handler(transport))
