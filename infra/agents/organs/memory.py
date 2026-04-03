"""
MEMORY organ — read/write conversation history + knowledge.
Each agent has their own memory namespace.
"""
from loguru import logger


class Memory:
    def __init__(self, agent_name: str, max_messages: int = 50):
        self.agent_name = agent_name
        self.max_messages = max_messages
        self.messages = []
        self.facts = {}  # key-value permanent facts

    def add(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]

    def get_history(self) -> list:
        return self.messages.copy()

    def remember(self, key: str, value: str):
        self.facts[key] = value
        logger.info(f"[{self.agent_name}] Remembered: {key} = {value[:50]}")

    def recall(self, key: str) -> str:
        return self.facts.get(key, "")

    def get_context_summary(self) -> str:
        """Get a brief summary of what this agent knows."""
        facts_str = ", ".join(f"{k}={v[:30]}" for k, v in self.facts.items()) if self.facts else "none"
        return f"Messages: {len(self.messages)}, Facts: {facts_str}"

    def clear(self):
        self.messages = []
