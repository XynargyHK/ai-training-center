"""
Fallback / Resilience — circuit breaker for Brain calls.
If Brain is down, tools fail gracefully and voice continues.
"""
import time
import aiohttp
from loguru import logger

# Circuit breaker state
_brain_failures = 0
_brain_last_failure = 0.0
_brain_circuit_open = False
FAILURE_THRESHOLD = 3
RECOVERY_TIME = 60  # seconds


async def call_brain(url: str, json: dict, timeout: float = 15) -> dict:
    """Call Brain with circuit breaker. Returns result or error dict."""
    global _brain_failures, _brain_last_failure, _brain_circuit_open

    # Check if circuit is open
    if _brain_circuit_open:
        if time.time() - _brain_last_failure > RECOVERY_TIME:
            logger.info("Brain circuit breaker: attempting recovery")
            _brain_circuit_open = False
        else:
            return {"status": "failed", "error": "Brain temporarily unavailable (circuit open)"}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url, json=json, timeout=aiohttp.ClientTimeout(total=timeout)
            ) as resp:
                data = await resp.json()
                # Reset failures on success
                _brain_failures = 0
                return data
    except Exception as e:
        _brain_failures += 1
        _brain_last_failure = time.time()
        if _brain_failures >= FAILURE_THRESHOLD:
            _brain_circuit_open = True
            logger.error(f"Brain circuit breaker OPEN after {_brain_failures} failures")
        else:
            logger.warning(f"Brain call failed ({_brain_failures}/{FAILURE_THRESHOLD}): {e}")
        return {"status": "failed", "error": str(e)}
