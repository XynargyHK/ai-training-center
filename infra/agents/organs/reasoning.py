"""
REASONING organ — step-by-step thinking.
Breaks complex tasks into sub-steps and tracks progress.
"""
from loguru import logger


class Reasoning:
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.current_plan = []
        self.step_index = 0

    def plan(self, task: str, steps: list):
        """Create a plan for a complex task."""
        self.current_plan = steps
        self.step_index = 0
        logger.info(f"[{self.agent_name}] Plan created: {task} → {len(steps)} steps")

    def next_step(self) -> dict:
        """Get the next step to execute."""
        if self.step_index >= len(self.current_plan):
            return {"done": True, "step": None}
        step = self.current_plan[self.step_index]
        self.step_index += 1
        return {"done": False, "step": step, "progress": f"{self.step_index}/{len(self.current_plan)}"}

    def is_complete(self) -> bool:
        return self.step_index >= len(self.current_plan)

    def reset(self):
        self.current_plan = []
        self.step_index = 0
