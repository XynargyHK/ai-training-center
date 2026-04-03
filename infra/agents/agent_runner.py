"""
AGENT RUNNER — loads staff configs and creates agent instances.
The factory that builds AI Staff from JSON blueprints.
"""
import os
import json
from loguru import logger
from base_agent import BaseAgent


STAFFS_DIR = os.path.join(os.path.dirname(__file__), "staffs")


def load_all_staffs() -> dict:
    """Load all staff configs and create agent instances."""
    agents = {}
    for filename in os.listdir(STAFFS_DIR):
        if filename.endswith(".json"):
            path = os.path.join(STAFFS_DIR, filename)
            agent = BaseAgent.from_config_file(path)
            agents[agent.name] = agent
            logger.info(f"Loaded staff: {agent.name}")
    return agents


def load_staff(name: str) -> BaseAgent:
    """Load a specific staff by config filename (without .json)."""
    path = os.path.join(STAFFS_DIR, f"{name}.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Staff config not found: {path}")
    return BaseAgent.from_config_file(path)


if __name__ == "__main__":
    # Quick test — load all staffs and print status
    agents = load_all_staffs()
    print(f"\nLoaded {len(agents)} AI Staff members:\n")
    for name, agent in agents.items():
        status = agent.get_status()
        print(f"  {status['name']}")
        print(f"    LLM: {status['llm']}")
        print(f"    Tools: {', '.join(status['tools'])}")
        print(f"    Organs: {status['organs']}")
        print()
