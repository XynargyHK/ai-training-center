"""
BASE AGENT — the body template.
Every AI Staff is an instance of this class with different config.
All organs are always present. Config decides which ones activate.
"""
import json
import os
from loguru import logger

from organs.brain import think as brain_think
from organs.memory import Memory
from organs.reasoning import Reasoning
from organs.action_logger import ActionLogger
from organs.cost_control import CostControl
from organs.guardrails import Guardrails
from organs.compaction import should_compact, compact
from organs.heartbeat import Heartbeat
from organs.evaluator import evaluate


class BaseAgent:
    def __init__(self, config: dict):
        """Create an AI Staff member from config.

        Args:
            config: dict with name, llm, tools, soul, organs_active, etc.
        """
        self.name = config.get("name", "Agent")
        self.config = config

        # LLM config
        self.llm_primary = config.get("llm_primary", "gemini-2.5-flash")
        self.llm_bulk = config.get("llm_bulk", "gemini-2.0-flash")
        self.llm_routing = config.get("llm_routing", {})

        # Soul — who this agent is
        self.soul = config.get("soul", "You are a helpful AI assistant.")

        # Tools this agent can use
        self.available_tools = config.get("tools", [])

        # Organs — always created, config decides if active
        self.memory = Memory(self.name)
        self.reasoning = Reasoning(self.name)
        self.logger = ActionLogger(self.name)
        self.cost = CostControl(self.name)
        self.guardrails = Guardrails(self.name)
        self.heartbeat = Heartbeat(self.name, config.get("heartbeat_interval", 60))

        # Organ activation flags
        organs = config.get("organs_active", {})
        self.has_voice = organs.get("voice", False)
        self.has_ears = organs.get("ears", False)
        self.has_eyes = organs.get("eyes", False)
        self.has_heartbeat = organs.get("heartbeat", False)

        # Autonomous behavior
        self.autonomous = config.get("autonomous_behavior", {})

        logger.info(f"[{self.name}] Agent created | LLM: {self.llm_primary} | Tools: {len(self.available_tools)} | Voice: {self.has_voice}")

    async def process(self, message: str, task_type: str = "default") -> dict:
        """Process a message — the main entry point.

        Args:
            message: User's message or task description
            task_type: Used for LLM routing (e.g., 'scraping', 'analysis', 'final_review')

        Returns:
            dict with 'response', 'actions_taken', etc.
        """
        # 1. GUARDRAILS — check input
        safety = self.guardrails.check_input(message)
        if not safety["safe"]:
            self.logger.log("blocked_input", {"reason": safety["reason"]})
            return {"response": "I can't process that request.", "blocked": True}

        # 2. MEMORY — add to history
        self.memory.add("user", message)

        # 3. COMPACTION — check if memory is full
        if should_compact(self.memory.get_history()):
            self.logger.log("compacting_memory")
            summary = await compact(self.memory.get_history(), brain_think)
            self.memory.remember("conversation_summary", summary.get("summary", ""))
            self.memory.clear()
            self.memory.add("system", f"Previous conversation summary: {summary.get('summary', '')}")

        # 4. BRAIN — pick the right LLM for the task
        model = self.llm_routing.get(task_type, self.llm_primary)

        # 5. BRAIN — think
        result = await brain_think(
            message=message,
            model=model,
            system_prompt=self.soul,
            conversation_history=self.memory.get_history()[:-1],  # exclude current message
        )

        # 6. COST — track usage
        if "usage" in result:
            self.cost.track(model, result["usage"])

        # 7. GUARDRAILS — check output
        response = self.guardrails.check_output(result.get("response", ""))

        # 8. MEMORY — save response
        self.memory.add("assistant", response)

        # 9. LOGGER — record action
        self.logger.log("responded", {
            "model": model,
            "input_length": len(message),
            "output_length": len(response),
            "has_function_calls": bool(result.get("function_calls")),
        })

        return {
            "response": response,
            "function_calls": result.get("function_calls", []),
            "model_used": model,
            "cost_summary": self.cost.summary(model),
        }

    async def execute_tool(self, tool_name: str, arguments: dict) -> dict:
        """Execute a tool (hands). Tool must be in available_tools list."""
        if tool_name not in self.available_tools:
            self.logger.log("tool_denied", {"tool": tool_name, "reason": "not in available_tools"})
            return {"error": f"{self.name} doesn't have the '{tool_name}' skill"}

        self.logger.log("tool_execute", {"tool": tool_name, "args": arguments})

        # Import and run the tool from the shared tools library
        try:
            tool_module = __import__(f"tools.{tool_name}", fromlist=[tool_name])
            if hasattr(tool_module, "execute"):
                result = await tool_module.execute(**arguments)
            else:
                result = {"error": f"Tool {tool_name} has no execute function"}
        except ImportError:
            result = {"error": f"Tool {tool_name} not found"}
        except Exception as e:
            result = {"error": str(e)}

        self.logger.log("tool_result", {"tool": tool_name, "status": result.get("status", "unknown")})
        return result

    async def self_evaluate(self, user_message: str, response: str) -> dict:
        """Rate own performance."""
        scores = await evaluate(user_message, response, brain_think)
        self.logger.log("self_evaluation", scores)
        return scores

    def get_status(self) -> dict:
        """Get agent status summary."""
        return {
            "name": self.name,
            "llm": self.llm_primary,
            "tools": self.available_tools,
            "memory": self.memory.get_context_summary(),
            "cost": self.cost.summary(self.llm_primary),
            "actions": self.logger.count(),
            "organs": {
                "voice": self.has_voice,
                "ears": self.has_ears,
                "eyes": self.has_eyes,
                "heartbeat": self.has_heartbeat,
            },
        }

    @classmethod
    def from_config_file(cls, config_path: str) -> "BaseAgent":
        """Create an agent from a JSON config file."""
        with open(config_path) as f:
            config = json.load(f)
        return cls(config)
