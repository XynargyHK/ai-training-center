"""
HEARTBEAT organ — keeps the agent alive and checking for work.
Runs periodic checks: pending tasks, scheduled jobs, health status.
"""
import asyncio
from loguru import logger


class Heartbeat:
    def __init__(self, agent_name: str, interval_seconds: int = 60):
        self.agent_name = agent_name
        self.interval = interval_seconds
        self.running = False
        self.beat_count = 0
        self.check_functions = []  # list of async functions to call each beat

    def register_check(self, fn):
        """Register a function to call every heartbeat."""
        self.check_functions.append(fn)

    async def start(self):
        """Start the heartbeat loop."""
        self.running = True
        logger.info(f"[{self.agent_name}] Heartbeat started (every {self.interval}s)")
        while self.running:
            self.beat_count += 1
            for fn in self.check_functions:
                try:
                    await fn()
                except Exception as e:
                    logger.error(f"[{self.agent_name}] Heartbeat check failed: {e}")
            await asyncio.sleep(self.interval)

    def stop(self):
        self.running = False
        logger.info(f"[{self.agent_name}] Heartbeat stopped after {self.beat_count} beats")
