"""
LOGGER organ (nervous system) — tracks every action, decision, and why.
"""
import time
from loguru import logger


class ActionLogger:
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.actions = []

    def log(self, action: str, details: dict = {}):
        entry = {
            "agent": self.agent_name,
            "action": action,
            "details": details,
            "timestamp": time.time(),
        }
        self.actions.append(entry)
        logger.info(f"[{self.agent_name}] {action}: {details}")

    def get_recent(self, n: int = 10) -> list:
        return self.actions[-n:]

    def count(self) -> int:
        return len(self.actions)
