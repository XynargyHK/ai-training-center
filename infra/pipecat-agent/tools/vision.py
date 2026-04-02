"""
Vision Tool — on-demand camera frame capture + Gemini description.
Lives in PIPECAT (not Brain) because it needs transport access for frame capture.

When user says "what do you see?", Gemini calls this tool.
Tool requests a frame from Daily transport → frame gets added to LLM context →
Gemini describes it → TTS speaks the description.

Cost: ~258 tokens per frame. Only captured when asked, not streaming.
"""
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams
from pipecat.frames.frames import UserImageRequestFrame
from pipecat.processors.frame_processor import FrameDirection


schema = FunctionSchema(
    name="describe_camera",
    description="Look at the user's camera and describe what you see. Use when the user asks 'what do you see', 'look at this', 'what is this', 'can you see', 'describe what you see', or shows something to the camera.",
    properties={
        "question": {
            "type": "string",
            "description": "What the user wants to know about what they're showing"
        }
    },
    required=["question"],
)


def create_handler(llm_service, participant_id_ref):
    """Create the vision handler.

    Args:
        llm_service: The LLM service (needed to push frame upstream)
        participant_id_ref: A mutable list [participant_id] — updated when participant joins
    """
    async def handle(params: FunctionCallParams):
        question = params.arguments.get("question", "Describe what you see")
        pid = participant_id_ref[0] if participant_id_ref else None
        logger.info(f"Vision: capturing frame for '{question}', participant: {pid}")

        if not pid:
            await params.result_callback({
                "status": "failed",
                "error": "No participant connected with camera",
            })
            return

        # Push UserImageRequestFrame upstream — transport captures a frame,
        # aggregator adds it to context, LLM runs again with the image
        await llm_service.push_frame(
            UserImageRequestFrame(
                user_id=pid,
                context=params.function_call_context,
            ),
            FrameDirection.UPSTREAM,
        )

        # The frame will be processed by the pipeline — no result_callback needed
        # because the LLM will run again with the image in context and generate
        # a response naturally
        await params.result_callback({
            "status": "capturing",
            "instruction": f"A camera frame is being captured. Look at the image and answer: {question}",
        })

    return handle


def register(llm, participant_id_ref):
    """Register this tool with the LLM service."""
    llm.register_function("describe_camera", create_handler(llm, participant_id_ref))
