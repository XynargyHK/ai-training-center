"""
SCHEDULE TASK tool — schedules any tool to run at a future time.
Universal: works for send_message, search_web, or any other tool.
The heartbeat organ checks every minute and fires due tasks.

Input: tool_name, arguments, scheduled_at
Output: task_id, status
"""
import os
import aiohttp
from loguru import logger

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


async def execute(tool_name: str, arguments: dict, scheduled_at: str,
                  timezone: str = "Asia/Hong_Kong", recurrence: str = None,
                  business_unit_id: str = "", created_by: str = "agent") -> dict:
    """Schedule a tool to run at a future time.

    Args:
        tool_name: Which tool to run (e.g. 'send_message', 'search_web')
        arguments: Arguments to pass to the tool
        scheduled_at: ISO datetime when to fire (e.g. '2026-04-05T15:00:00+08:00')
        timezone: Timezone for the schedule
        recurrence: null=once, 'daily', 'weekly', 'monthly'
        business_unit_id: Optional BU context
        created_by: Who created this task

    Returns:
        dict with task_id and status
    """
    logger.info(f"Scheduling {tool_name} at {scheduled_at} (recurrence={recurrence})")

    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "failed", "error": "Database not configured"}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{SUPABASE_URL}/rest/v1/scheduled_tasks",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                },
                json={
                    "tool_name": tool_name,
                    "arguments": arguments,
                    "scheduled_at": scheduled_at,
                    "timezone": timezone,
                    "recurrence": recurrence,
                    "business_unit_id": business_unit_id or None,
                    "created_by": created_by,
                    "status": "pending",
                },
                timeout=aiohttp.ClientTimeout(total=5),
            ) as resp:
                if resp.status in (200, 201):
                    data = await resp.json()
                    task_id = data[0]["id"] if isinstance(data, list) and data else "unknown"
                    return {
                        "status": "scheduled",
                        "task_id": task_id,
                        "tool": tool_name,
                        "scheduled_at": scheduled_at,
                        "recurrence": recurrence,
                    }
                else:
                    error = await resp.text()
                    return {"status": "failed", "error": error}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


async def list_pending(business_unit_id: str = "") -> list:
    """List all pending scheduled tasks."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []

    try:
        url = f"{SUPABASE_URL}/rest/v1/scheduled_tasks?status=eq.pending&order=scheduled_at.asc"
        if business_unit_id:
            url += f"&business_unit_id=eq.{business_unit_id}"

        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            }, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    return await resp.json()
                return []
    except:
        return []


async def cancel(task_id: str) -> dict:
    """Cancel a scheduled task."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "failed", "error": "Database not configured"}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.patch(
                f"{SUPABASE_URL}/rest/v1/scheduled_tasks?id=eq.{task_id}",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                },
                json={"status": "cancelled"},
                timeout=aiohttp.ClientTimeout(total=5),
            ) as resp:
                if resp.status in (200, 204):
                    return {"status": "cancelled", "task_id": task_id}
                return {"status": "failed", "error": await resp.text()}
    except Exception as e:
        return {"status": "failed", "error": str(e)}
