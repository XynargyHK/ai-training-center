"""
Reasoning Logger — Level 2 AI-Native Observability.
Sits in the pipeline and logs LLM decisions:
- What tool was called and why
- Function call arguments
- Response timing (TTFB)
- Token usage (if available)

Logs to loguru for now. Can be extended to send to Supabase.
"""
from loguru import logger
from pipecat.frames.frames import TextFrame, TranscriptionFrame
from pipecat.processors.frame_processor import FrameProcessor


class ReasoningLogger(FrameProcessor):
    """Logs LLM reasoning — what the AI decided and why.
    Captures user input, AI output, and function calls."""

    def __init__(self, name="ReasoningLogger"):
        super().__init__(name=name)
        self._current_user_text = ""
        self._current_ai_text = ""
        self._turn_count = 0

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        # Log user speech (from STT)
        if isinstance(frame, TranscriptionFrame):
            self._current_user_text = frame.text
            self._turn_count += 1
            logger.info(f"[REASON] Turn {self._turn_count} | User: {frame.text}")

        # Log AI response text
        if isinstance(frame, TextFrame):
            self._current_ai_text += frame.text

        # Detect function calls by frame type name
        fn = type(frame).__name__
        if "FunctionCall" in fn:
            # Log the function call decision
            func_name = getattr(frame, 'function_name', getattr(frame, 'name', '?'))
            args = getattr(frame, 'arguments', getattr(frame, 'args', {}))
            logger.info(f"[REASON] Turn {self._turn_count} | TOOL CALL: {func_name}({args})")

        if "LLMFullResponseEnd" in fn or "LLMResponseEnd" in fn:
            if self._current_ai_text:
                logger.info(f"[REASON] Turn {self._turn_count} | AI: {self._current_ai_text[:200]}")
                self._current_ai_text = ""

        await self.push_frame(frame, direction)
