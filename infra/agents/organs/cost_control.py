"""
COST CONTROL organ (metabolism) — tracks token usage and estimated cost.
"""
from loguru import logger

COST_PER_1M = {
    "gemini-2.0-flash": {"input": 0.075, "output": 0.30},
    "gemini-2.5-flash": {"input": 0.15, "output": 0.60},
    "gemini-2.5-pro": {"input": 1.25, "output": 5.00},
}


class CostControl:
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.call_count = 0

    def track(self, model: str, usage: dict):
        input_t = usage.get("promptTokenCount", usage.get("prompt_tokens", 0))
        output_t = usage.get("candidatesTokenCount", usage.get("completion_tokens", 0))
        self.total_input_tokens += input_t
        self.total_output_tokens += output_t
        self.call_count += 1

    def get_cost(self, model: str = "gemini-2.5-flash") -> float:
        rates = COST_PER_1M.get(model, COST_PER_1M["gemini-2.5-flash"])
        input_cost = (self.total_input_tokens / 1_000_000) * rates["input"]
        output_cost = (self.total_output_tokens / 1_000_000) * rates["output"]
        return round(input_cost + output_cost, 6)

    def summary(self, model: str = "gemini-2.5-flash") -> str:
        cost = self.get_cost(model)
        return f"{self.agent_name}: {self.call_count} calls, ~{self.total_input_tokens + self.total_output_tokens} tokens, ~${cost}"
