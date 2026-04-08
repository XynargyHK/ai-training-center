"""
CREATE CONTENT tool — CRUD operations on the content_library table.
Handles content creation, repurposing, listing, status updates, and performance tracking.

This tool does NOT generate creative content itself. It returns templates/prompts
that the Brain's LLM fills in. The tool is purely for database operations.

Input: varies per function (see docstrings)
Output: content entries from Supabase
"""
import os
import json
import aiohttp
from loguru import logger

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

# ── Content types ──────────────────────────────────────────────────────────
CONTENT_TYPES = [
    "short_video", "long_video", "text_post", "article", "email",
    "visual", "audio", "course", "challenge", "coaching_drip",
    "lead_magnet", "interactive", "sales",
]

# ── Platforms ──────────────────────────────────────────────────────────────
PLATFORMS = [
    "tiktok", "youtube", "linkedin", "instagram", "twitter",
    "facebook", "email", "whatsapp",
]

# ── Statuses ───────────────────────────────────────────────────────────────
STATUSES = [
    "idea", "draft", "review", "approved", "rendering",
    "ready", "scheduled", "published", "archived",
]

# ── Platform constraints (Brain uses these to shape output) ────────────────
PLATFORM_SPECS = {
    "tiktok":    {"max_length": 150, "format": "vertical_video", "tone": "casual, trendy", "hashtags": True},
    "youtube":   {"max_length": 5000, "format": "horizontal_video", "tone": "engaging, educational", "hashtags": True},
    "linkedin":  {"max_length": 3000, "format": "text_post", "tone": "professional, insightful", "hashtags": True},
    "instagram": {"max_length": 2200, "format": "visual_first", "tone": "visual, aspirational", "hashtags": True},
    "twitter":   {"max_length": 280, "format": "text_post", "tone": "concise, punchy", "hashtags": True},
    "facebook":  {"max_length": 5000, "format": "text_post", "tone": "conversational", "hashtags": False},
    "email":     {"max_length": None, "format": "email", "tone": "personal, direct", "hashtags": False},
    "whatsapp":  {"max_length": 4096, "format": "message", "tone": "friendly, concise", "hashtags": False},
}

# ── 12 Hook Formulas (templates for Brain to fill) ─────────────────────────
HOOK_FORMULAS = {
    "contrarian": {
        "name": "Contrarian",
        "template": "Most people think {common_belief} about {topic}. They're wrong. Here's why...",
        "best_for": ["article", "long_video", "text_post"],
    },
    "curiosity_gap": {
        "name": "Curiosity Gap",
        "template": "I discovered something about {topic} that changed everything — and nobody is talking about it.",
        "best_for": ["short_video", "text_post", "email"],
    },
    "story_open": {
        "name": "Story Open",
        "template": "Last week, something happened with {topic} that I never expected...",
        "best_for": ["long_video", "text_post", "article"],
    },
    "number_proof": {
        "name": "Number/Proof",
        "template": "{number} {result} in {timeframe} — here's the exact {topic} strategy.",
        "best_for": ["short_video", "text_post", "lead_magnet"],
    },
    "question": {
        "name": "Question Hook",
        "template": "What if everything you knew about {topic} was holding you back?",
        "best_for": ["email", "text_post", "short_video"],
    },
    "pain_point": {
        "name": "Pain Point",
        "template": "Struggling with {topic}? You're not alone — but most solutions make it worse.",
        "best_for": ["sales", "lead_magnet", "coaching_drip"],
    },
    "authority": {
        "name": "Authority",
        "template": "After {years/experience} in {topic}, here are the {number} things that actually matter.",
        "best_for": ["article", "long_video", "course"],
    },
    "before_after": {
        "name": "Before/After",
        "template": "Before I understood {topic}: {pain}. After: {result}. Here's the bridge.",
        "best_for": ["short_video", "visual", "sales"],
    },
    "listicle": {
        "name": "Listicle",
        "template": "{number} {topic} tips that will change how you {outcome}.",
        "best_for": ["article", "text_post", "email"],
    },
    "warning": {
        "name": "Warning",
        "template": "Stop doing this with {topic} — it's costing you {what_lost}.",
        "best_for": ["short_video", "email", "text_post"],
    },
    "analogy": {
        "name": "Analogy",
        "template": "{topic} is like {analogy} — and once you see it, you can't unsee it.",
        "best_for": ["text_post", "article", "long_video"],
    },
    "prediction": {
        "name": "Prediction",
        "template": "In {timeframe}, {topic} will look completely different. Here's what's coming.",
        "best_for": ["article", "long_video", "text_post"],
    },
}


# ═══════════════════════════════════════════════════════════════════════════
# execute — Create content entry in content_library
# ═══════════════════════════════════════════════════════════════════════════

async def execute(
    content_type: str,
    title: str,
    topic: str,
    target_platform: str,
    body: str = "",
    hook: str = "",
    cta: str = "",
    target_audience: str = "",
    hook_formula: str = "",
    language: str = "en",
    production_level: int = 1,
    parent_id: str = "",
    campaign_id: str = "",
    sequence_order: int = None,
    business_unit_id: str = "",
) -> dict:
    """Create a content entry in the content_library table.

    The Brain generates the creative content (hook, body, cta) using its LLM,
    then calls this tool to persist it.

    Args:
        content_type: One of: short_video, long_video, text_post, article, email,
                      visual, audio, course, challenge, coaching_drip,
                      lead_magnet, interactive, sales
        title: Content title
        topic: Topic/subject
        target_platform: tiktok, youtube, linkedin, instagram, twitter,
                         facebook, email, whatsapp
        body: The generated content body/script (from Brain)
        hook: The generated hook (from Brain)
        cta: The generated call-to-action (from Brain)
        target_audience: Audience segment description
        hook_formula: Which formula was used (contrarian, curiosity_gap, etc.)
        language: Language code (default 'en')
        production_level: 1-5 complexity level
        parent_id: UUID of pillar content if repurposing
        campaign_id: UUID of campaign if part of one
        sequence_order: Order in a course/challenge sequence
        business_unit_id: Business unit UUID

    Returns:
        dict with created content entry or error
    """
    logger.info(f"Creating content: {content_type} / {target_platform} — {title}")

    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "failed", "error": "Database not configured"}

    if content_type not in CONTENT_TYPES:
        return {"status": "failed", "error": f"Invalid content_type '{content_type}'. Must be one of: {CONTENT_TYPES}"}

    if target_platform not in PLATFORMS:
        return {"status": "failed", "error": f"Invalid platform '{target_platform}'. Must be one of: {PLATFORMS}"}

    if production_level < 1 or production_level > 5:
        return {"status": "failed", "error": "production_level must be 1-5"}

    # If no body/hook/cta provided, return the template for the Brain to fill
    if not body and not hook:
        platform_spec = PLATFORM_SPECS.get(target_platform, {})
        formula_info = HOOK_FORMULAS.get(hook_formula, {})

        # Pick best formula if none specified
        if not hook_formula:
            for fname, fdata in HOOK_FORMULAS.items():
                if content_type in fdata.get("best_for", []):
                    formula_info = fdata
                    hook_formula = fname
                    break

        return {
            "status": "needs_generation",
            "message": "Brain should generate hook, body, and cta, then call execute() again with them filled in.",
            "template": {
                "content_type": content_type,
                "title": title,
                "topic": topic,
                "target_platform": target_platform,
                "platform_spec": platform_spec,
                "suggested_hook_formula": hook_formula,
                "hook_template": formula_info.get("template", ""),
                "target_audience": target_audience,
                "language": language,
            },
        }

    # Build the row
    row = {
        "content_type": content_type,
        "title": title,
        "topic": topic,
        "target_platform": target_platform,
        "hook": hook,
        "hook_formula": hook_formula or None,
        "body": body,
        "cta": cta,
        "target_audience": target_audience or None,
        "language": language,
        "production_level": production_level,
        "parent_id": parent_id or None,
        "campaign_id": campaign_id or None,
        "sequence_order": sequence_order,
        "business_unit_id": business_unit_id or None,
        "status": "draft",
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{SUPABASE_URL}/rest/v1/content_library",
                headers=SUPABASE_HEADERS,
                json=row,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status in (200, 201):
                    data = await resp.json()
                    entry = data[0] if isinstance(data, list) and data else data
                    logger.info(f"Content created: {entry.get('id', 'unknown')} — {title}")
                    return {"status": "created", "content": entry}
                else:
                    error = await resp.text()
                    logger.error(f"Content creation failed: {error[:200]}")
                    return {"status": "failed", "error": error[:500]}
    except Exception as e:
        logger.error(f"Content creation error: {e}")
        return {"status": "failed", "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════
# generate_hooks — Return hook formula templates for Brain to evaluate
# ═══════════════════════════════════════════════════════════════════════════

async def generate_hooks(
    topic: str,
    content_type: str = "",
    count: int = 5,
    formulas: list = None,
) -> list:
    """Return hook formula templates with the topic plugged in.

    The Brain's LLM evaluates these templates and produces the final hooks.
    This tool just provides the raw formulas — no LLM call happens here.

    Args:
        topic: The topic to plug into templates
        content_type: If provided, prioritizes formulas best suited for this type
        count: How many variants to return (default 5, max 12)
        formulas: Specific formula names to use (overrides auto-selection)

    Returns:
        List of hook templates with formula names and topic applied
    """
    count = min(count, 12)
    result = []

    if formulas:
        # Use the specific formulas requested
        for fname in formulas:
            formula = HOOK_FORMULAS.get(fname)
            if formula:
                result.append({
                    "formula": fname,
                    "name": formula["name"],
                    "template": formula["template"].replace("{topic}", topic),
                    "raw_template": formula["template"],
                    "best_for": formula["best_for"],
                })
    else:
        # Auto-select: prioritize formulas that match the content type
        scored = []
        for fname, fdata in HOOK_FORMULAS.items():
            priority = 0
            if content_type and content_type in fdata.get("best_for", []):
                priority = 1
            scored.append((priority, fname, fdata))

        # Sort: best-fit first, then alphabetical
        scored.sort(key=lambda x: (-x[0], x[1]))

        for _, fname, fdata in scored[:count]:
            result.append({
                "formula": fname,
                "name": fdata["name"],
                "template": fdata["template"].replace("{topic}", topic),
                "raw_template": fdata["template"],
                "best_for": fdata["best_for"],
            })

    return result


# ═══════════════════════════════════════════════════════════════════════════
# repurpose — Fetch pillar content, create derivatives for other platforms
# ═══════════════════════════════════════════════════════════════════════════

async def repurpose(
    content_id: str,
    target_platforms: list,
    business_unit_id: str = "",
) -> dict:
    """Fetch a pillar content entry and create derivative stubs for other platforms.

    Each derivative links back to the original via parent_id.
    The Brain should then generate adapted body/hook/cta for each platform.

    Args:
        content_id: UUID of the pillar content to repurpose
        target_platforms: List of platform names to create derivatives for
        business_unit_id: Business unit UUID

    Returns:
        dict with original content and list of created derivatives (or templates to fill)
    """
    logger.info(f"Repurposing content {content_id} to {target_platforms}")

    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "failed", "error": "Database not configured"}

    # Step 1: Fetch the original content
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{SUPABASE_URL}/rest/v1/content_library?id=eq.{content_id}&select=*",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                },
                timeout=aiohttp.ClientTimeout(total=5),
            ) as resp:
                if resp.status != 200:
                    return {"status": "failed", "error": f"Failed to fetch content: {await resp.text()}"}
                data = await resp.json()
                if not data:
                    return {"status": "failed", "error": f"Content {content_id} not found"}
                original = data[0]
    except Exception as e:
        return {"status": "failed", "error": str(e)}

    # Step 2: Create derivative stubs for each target platform
    derivatives = []
    for platform in target_platforms:
        if platform not in PLATFORMS:
            derivatives.append({"platform": platform, "status": "skipped", "error": f"Invalid platform: {platform}"})
            continue

        platform_spec = PLATFORM_SPECS.get(platform, {})

        derivatives.append({
            "platform": platform,
            "status": "needs_generation",
            "message": "Brain should adapt the original content for this platform, then call execute() to save.",
            "template": {
                "content_type": original.get("content_type", "text_post"),
                "title": f"[{platform.upper()}] {original.get('title', '')}",
                "topic": original.get("topic", ""),
                "target_platform": platform,
                "platform_spec": platform_spec,
                "parent_id": content_id,
                "business_unit_id": business_unit_id or original.get("business_unit_id", ""),
                "language": original.get("language", "en"),
                "original_body": original.get("body", ""),
                "original_hook": original.get("hook", ""),
                "original_cta": original.get("cta", ""),
            },
        })

    return {
        "status": "ok",
        "original": original,
        "derivatives": derivatives,
    }


# ═══════════════════════════════════════════════════════════════════════════
# list_content — Query content_library with filters
# ═══════════════════════════════════════════════════════════════════════════

async def list_content(
    business_unit_id: str = "",
    content_type: str = "",
    status: str = "",
    campaign_id: str = "",
    parent_id: str = "",
    limit: int = 20,
) -> list:
    """List content entries with optional filters.

    Args:
        business_unit_id: Filter by business unit
        content_type: Filter by content type
        status: Filter by status
        campaign_id: Filter by campaign
        parent_id: Filter by parent (find derivatives)
        limit: Max results (default 20)

    Returns:
        List of content entries
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []

    url = f"{SUPABASE_URL}/rest/v1/content_library?select=*&order=created_at.desc&limit={limit}"

    if business_unit_id:
        url += f"&business_unit_id=eq.{business_unit_id}"
    if content_type:
        url += f"&content_type=eq.{content_type}"
    if status:
        url += f"&status=eq.{status}"
    if campaign_id:
        url += f"&campaign_id=eq.{campaign_id}"
    if parent_id:
        url += f"&parent_id=eq.{parent_id}"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                },
                timeout=aiohttp.ClientTimeout(total=5),
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
                logger.error(f"list_content failed: {await resp.text()}")
                return []
    except Exception as e:
        logger.error(f"list_content error: {e}")
        return []


# ═══════════════════════════════════════════════════════════════════════════
# update_status — Move content through the pipeline
# ═══════════════════════════════════════════════════════════════════════════

async def update_status(content_id: str, new_status: str) -> dict:
    """Update the status of a content entry.

    Args:
        content_id: UUID of the content
        new_status: One of: idea, draft, review, approved, rendering,
                    ready, scheduled, published, archived

    Returns:
        dict with update result
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "failed", "error": "Database not configured"}

    if new_status not in STATUSES:
        return {"status": "failed", "error": f"Invalid status '{new_status}'. Must be one of: {STATUSES}"}

    logger.info(f"Updating content {content_id} status to {new_status}")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.patch(
                f"{SUPABASE_URL}/rest/v1/content_library?id=eq.{content_id}",
                headers=SUPABASE_HEADERS,
                json={"status": new_status},
                timeout=aiohttp.ClientTimeout(total=5),
            ) as resp:
                if resp.status in (200, 204):
                    data = await resp.json() if resp.status == 200 else {}
                    return {"status": "updated", "content_id": content_id, "new_status": new_status}
                else:
                    error = await resp.text()
                    return {"status": "failed", "error": error[:500]}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════
# update_performance — Store analytics/metrics data
# ═══════════════════════════════════════════════════════════════════════════

async def update_performance(content_id: str, metrics: dict) -> dict:
    """Store performance analytics for a content entry.

    Args:
        content_id: UUID of the content
        metrics: Dict with any of: views, likes, shares, saves, comments,
                 ctr, completion_rate

    Returns:
        dict with update result
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "failed", "error": "Database not configured"}

    # Validate metric keys
    valid_keys = {"views", "likes", "shares", "saves", "comments", "ctr", "completion_rate"}
    filtered = {k: v for k, v in metrics.items() if k in valid_keys}

    if not filtered:
        return {"status": "failed", "error": f"No valid metrics provided. Valid keys: {valid_keys}"}

    logger.info(f"Updating performance for content {content_id}: {filtered}")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.patch(
                f"{SUPABASE_URL}/rest/v1/content_library?id=eq.{content_id}",
                headers=SUPABASE_HEADERS,
                json={"performance": filtered},
                timeout=aiohttp.ClientTimeout(total=5),
            ) as resp:
                if resp.status in (200, 204):
                    return {"status": "updated", "content_id": content_id, "metrics": filtered}
                else:
                    error = await resp.text()
                    return {"status": "failed", "error": error[:500]}
    except Exception as e:
        return {"status": "failed", "error": str(e)}
