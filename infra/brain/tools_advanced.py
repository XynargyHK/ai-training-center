"""
Advanced Brain tools — inspired by OpenClaw's built-in capabilities.
These are the tools that make the Brain a true research assistant.
"""
import os
import re
import aiohttp
from loguru import logger


# ============================================================
# 1. WEB FETCH — Read any URL and extract content
# ============================================================
async def web_fetch(url: str) -> dict:
    """Fetch a web page and extract readable text content."""
    logger.info(f"Fetching: {url}")
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                html = await resp.text()
                # Extract text from HTML
                text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
                text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
                text = re.sub(r'<[^>]+>', ' ', text)
                text = re.sub(r'\s+', ' ', text).strip()
                # Truncate to prevent token waste
                truncated = text[:5000]
                return {"url": url, "content": truncated, "length": len(text), "truncated": len(text) > 5000}
    except Exception as e:
        return {"url": url, "error": str(e)}


# ============================================================
# 2. EXEC COMMAND — Run shell commands (sandboxed)
# ============================================================
async def exec_command(command: str) -> dict:
    """Execute a shell command. Limited to safe commands only."""
    logger.info(f"Exec: {command}")

    # Safety: only allow specific safe commands
    ALLOWED_PREFIXES = ["curl", "date", "echo", "cat", "ls", "pwd", "whoami", "uname", "python3 -c"]
    BLOCKED_COMMANDS = ["rm", "dd", "mkfs", "sudo", "chmod", "chown", "kill", "shutdown", "reboot"]

    cmd_lower = command.strip().lower()
    if any(cmd_lower.startswith(blocked) for blocked in BLOCKED_COMMANDS):
        return {"error": f"Command blocked for safety: {command}", "allowed": False}

    if not any(cmd_lower.startswith(prefix) for prefix in ALLOWED_PREFIXES):
        return {"error": f"Command not in allowlist. Allowed: {', '.join(ALLOWED_PREFIXES)}", "allowed": False}

    try:
        import asyncio
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd="/tmp",
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10)
        output = stdout.decode()[:3000]
        errors = stderr.decode()[:1000]
        return {
            "command": command,
            "output": output,
            "errors": errors if errors else None,
            "exit_code": proc.returncode,
        }
    except asyncio.TimeoutError:
        return {"command": command, "error": "Command timed out (10s limit)"}
    except Exception as e:
        return {"command": command, "error": str(e)}


# ============================================================
# 3. READ FILE — Read file from workspace
# ============================================================
async def read_file(path: str) -> dict:
    """Read a file from the Brain's workspace."""
    logger.info(f"Reading file: {path}")
    # Safety: only allow reading from /tmp or workspace
    if not path.startswith(("/tmp/", "/app/")):
        return {"error": "Can only read files from /tmp/ or /app/", "path": path}
    try:
        with open(path, 'r') as f:
            content = f.read()[:10000]
        return {"path": path, "content": content, "length": len(content)}
    except Exception as e:
        return {"path": path, "error": str(e)}


# ============================================================
# 4. WRITE FILE — Write file to workspace
# ============================================================
async def write_file(path: str, content: str) -> dict:
    """Write content to a file in the Brain's workspace."""
    logger.info(f"Writing file: {path}")
    if not path.startswith("/tmp/"):
        return {"error": "Can only write files to /tmp/", "path": path}
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f:
            f.write(content)
        return {"path": path, "written": len(content), "status": "ok"}
    except Exception as e:
        return {"path": path, "error": str(e)}


# ============================================================
# 5. CALCULATE — Evaluate math expressions
# ============================================================
async def calculate(expression: str) -> dict:
    """Evaluate a mathematical expression safely."""
    logger.info(f"Calculating: {expression}")
    try:
        # Safe eval using only math operations
        import ast
        import operator

        allowed_ops = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
            ast.Pow: operator.pow,
            ast.Mod: operator.mod,
            ast.USub: operator.neg,
        }

        def safe_eval(node):
            if isinstance(node, ast.Constant):
                return node.value
            elif isinstance(node, ast.BinOp):
                left = safe_eval(node.left)
                right = safe_eval(node.right)
                op = allowed_ops.get(type(node.op))
                if op is None:
                    raise ValueError(f"Unsupported operation: {type(node.op).__name__}")
                return op(left, right)
            elif isinstance(node, ast.UnaryOp):
                operand = safe_eval(node.operand)
                op = allowed_ops.get(type(node.op))
                if op is None:
                    raise ValueError(f"Unsupported operation: {type(node.op).__name__}")
                return op(operand)
            else:
                raise ValueError(f"Unsupported expression: {ast.dump(node)}")

        tree = ast.parse(expression, mode='eval')
        result = safe_eval(tree.body)
        return {"expression": expression, "result": result}
    except Exception as e:
        return {"expression": expression, "error": str(e)}


# ============================================================
# 6. GENERATE IMAGE — Via Gemini (when available)
# ============================================================
async def generate_image(prompt: str) -> dict:
    """Generate an image using AI. Returns description for now — full generation coming."""
    logger.info(f"Image generation requested: {prompt}")
    # Placeholder — will integrate with DALL-E or Gemini image gen
    return {
        "prompt": prompt,
        "status": "planned",
        "note": "Image generation will be available soon. For now, I can search for relevant images online.",
    }


# ============================================================
# REGISTRY & DECLARATIONS FOR ADVANCED TOOLS
# ============================================================
ADVANCED_FUNCTION_REGISTRY = {
    "web_fetch": web_fetch,
    "exec_command": exec_command,
    "read_file": read_file,
    "write_file": write_file,
    "calculate": calculate,
    "generate_image": generate_image,
}

ADVANCED_TOOL_DECLARATIONS = [
    {
        "name": "web_fetch",
        "description": "Fetch and read the content of any web page URL. Use for research, reading articles, checking prices, or extracting information from websites.",
        "parameters": {"type": "object", "properties": {"url": {"type": "string", "description": "Full URL to fetch"}}, "required": ["url"]},
    },
    {
        "name": "exec_command",
        "description": "Execute a safe shell command. Allowed: curl, date, echo, cat, ls, python3 -c. Use for quick calculations, data processing, or API calls.",
        "parameters": {"type": "object", "properties": {"command": {"type": "string", "description": "Shell command to execute"}}, "required": ["command"]},
    },
    {
        "name": "read_file",
        "description": "Read a file from the workspace. Use to check saved data, logs, or configurations.",
        "parameters": {"type": "object", "properties": {"path": {"type": "string", "description": "File path (must start with /tmp/ or /app/)"}}, "required": ["path"]},
    },
    {
        "name": "write_file",
        "description": "Write content to a file in the workspace. Use to save notes, data, or generated content.",
        "parameters": {"type": "object", "properties": {"path": {"type": "string", "description": "File path (must start with /tmp/)"}, "content": {"type": "string", "description": "Content to write"}}, "required": ["path", "content"]},
    },
    {
        "name": "calculate",
        "description": "Evaluate a mathematical expression. Use for calculations, unit conversions, financial math.",
        "parameters": {"type": "object", "properties": {"expression": {"type": "string", "description": "Math expression, e.g. '(100 * 7.82) + 15.5'"}}, "required": ["expression"]},
    },
    {
        "name": "generate_image",
        "description": "Generate an image from a text description. (Coming soon — currently returns a placeholder.)",
        "parameters": {"type": "object", "properties": {"prompt": {"type": "string", "description": "Description of the image to generate"}}, "required": ["prompt"]},
    },
]
