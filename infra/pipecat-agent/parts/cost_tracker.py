"""
Cost Tracker — tracks token usage and estimated cost per session.
SLO: if 10K tokens for a 100-token problem, the architecture is failing.
"""
from loguru import logger
from pipecat.frames.frames import TextFrame, TranscriptionFrame
from pipecat.processors.frame_processor import FrameProcessor

# Rough cost estimates (per 1M tokens)
COST_PER_1M = {
    "gemini-2.0-flash": {"input": 0.075, "output": 0.30},
    "gemini-2.5-flash": {"input": 0.15, "output": 0.60},
    "deepgram-nova-2": {"per_minute": 0.0043},
    "azure-tts": {"per_1m_chars": 4.00},
}


class CostTracker(FrameProcessor):
    """Tracks estimated token/cost per session."""

    def __init__(self, name="CostTracker"):
        super().__init__(name=name)
        self._input_chars = 0
        self._output_chars = 0
        self._turns = 0

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame):
            self._input_chars += len(frame.text)
            self._turns += 1

        if isinstance(frame, TextFrame):
            self._output_chars += len(frame.text)

        await self.push_frame(frame, direction)

    def get_stats(self) -> dict:
        input_tokens = self._input_chars // 4
        output_tokens = self._output_chars // 4
        # Gemini 2.0 Flash costs
        input_cost = (input_tokens / 1_000_000) * COST_PER_1M["gemini-2.0-flash"]["input"]
        output_cost = (output_tokens / 1_000_000) * COST_PER_1M["gemini-2.0-flash"]["output"]
        return {
            "turns": self._turns,
            "input_tokens_est": input_tokens,
            "output_tokens_est": output_tokens,
            "total_tokens_est": input_tokens + output_tokens,
            "llm_cost_est_usd": round(input_cost + output_cost, 6),
        }

    def log_summary(self):
        stats = self.get_stats()
        logger.info(f"[COST] Session: {stats['turns']} turns, ~{stats['total_tokens_est']} tokens, ~${stats['llm_cost_est_usd']}")
