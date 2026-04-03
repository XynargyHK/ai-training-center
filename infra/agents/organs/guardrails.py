"""
GUARDRAILS organ — living experience system.
NOT a static filter. A growing collection of DO and DON'T rules
learned from 7 feedback sources. Shared across all staff.

Guardrails = Experience. Same brain on day 1 and day 1000,
massively more effective because of accumulated guardrails.

Feedback sources:
1. Admin explicit — human says "don't do that"
2. User barge-in — user interrupts = something went wrong
3. Evaluator scores — low score patterns auto-flagged
4. Peer review — another agent critiques the work
5. Customer reaction — reply/ignore/block/thank signals
6. Tool failure — function errors become "don't repeat" rules
7. A/B test results — losers become negative, winners become positive

Storage: Supabase guardrails table (not hardcoded)
Each guardrail has: type (positive/negative), rule text, source,
severity (red_flag/warning/suggestion), created_at, hit_count
"""
import os
import time
import aiohttp
from loguru import logger

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


class Guardrails:
    def __init__(self, agent_name: str, business_unit_id: str = ""):
        self.agent_name = agent_name
        self.business_unit_id = business_unit_id
        self.rules = []  # loaded from DB
        self.blocked_count = 0
        self.last_loaded = 0

    async def load_rules(self):
        """Load guardrails from Supabase. Cached for 5 minutes."""
        if time.time() - self.last_loaded < 300 and self.rules:
            return  # use cache

        if not SUPABASE_URL or not SUPABASE_KEY:
            # Fallback to default rules if no DB
            self.rules = self._default_rules()
            self.last_loaded = time.time()
            return

        try:
            async with aiohttp.ClientSession() as session:
                # Load shared rules (no BU filter) + BU-specific rules
                url = f"{SUPABASE_URL}/rest/v1/guardrails?select=*&or=(business_unit_id.is.null,business_unit_id.eq.{self.business_unit_id})&active=eq.true&order=severity.desc"
                async with session.get(url, headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                }, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        self.rules = await resp.json()
                    else:
                        self.rules = self._default_rules()
        except Exception as e:
            logger.warning(f"[{self.agent_name}] Failed to load guardrails from DB: {e}")
            self.rules = self._default_rules()

        self.last_loaded = time.time()
        logger.info(f"[{self.agent_name}] Loaded {len(self.rules)} guardrails ({len([r for r in self.rules if r.get('type') == 'positive'])} positive, {len([r for r in self.rules if r.get('type') == 'negative'])} negative)")

    def get_prompt_injection(self) -> str:
        """Generate prompt text from all guardrails to inject into system prompt.
        This is how experience becomes part of the agent's thinking."""
        if not self.rules:
            return ""

        positive = [r["rule"] for r in self.rules if r.get("type") == "positive"]
        negative = [r["rule"] for r in self.rules if r.get("type") == "negative"]
        red_flags = [r["rule"] for r in self.rules if r.get("severity") == "red_flag"]

        parts = []
        if red_flags:
            parts.append("CRITICAL RULES (never violate):\n" + "\n".join(f"- {r}" for r in red_flags))
        if negative:
            parts.append("DO NOT:\n" + "\n".join(f"- {r}" for r in negative))
        if positive:
            parts.append("ALWAYS:\n" + "\n".join(f"- {r}" for r in positive))

        return "\n\n".join(parts)

    def check_input(self, text: str) -> dict:
        """Check user input against red flag rules."""
        text_lower = text.lower()
        for rule in self.rules:
            if rule.get("severity") == "red_flag" and rule.get("type") == "negative":
                # Check if the rule pattern is in the input
                pattern = rule.get("pattern", "").lower()
                if pattern and pattern in text_lower:
                    self.blocked_count += 1
                    self._record_hit(rule)
                    logger.warning(f"[{self.agent_name}] BLOCKED input: '{pattern}'")
                    return {"safe": False, "reason": rule.get("rule", pattern), "rule_id": rule.get("id")}
        return {"safe": True}

    def check_output(self, text: str) -> str:
        """Filter output based on negative rules."""
        for rule in self.rules:
            if rule.get("type") == "negative" and rule.get("pattern"):
                pattern = rule["pattern"]
                if pattern.lower() in text.lower():
                    text = text.replace(pattern, "").replace(pattern.lower(), "")
                    self._record_hit(rule)
        return text.strip()

    # =========================================================
    # FEEDBACK INGESTION — 7 sources feed into guardrails
    # =========================================================

    async def learn_from_admin(self, feedback: str, feedback_type: str = "negative"):
        """Source 1: Admin explicitly says 'don't do that' or 'always do this'."""
        await self._save_guardrail(
            rule=feedback,
            guardrail_type=feedback_type,
            source="admin_explicit",
            severity="warning",
        )

    async def learn_from_barge_in(self, response_text: str, word_count_when_interrupted: int):
        """Source 2: User interrupted Sarah mid-sentence."""
        if word_count_when_interrupted < 5:
            # Interrupted very early = response was probably wrong
            await self._save_guardrail(
                rule=f"Response was interrupted early (after {word_count_when_interrupted} words). The approach or content was wrong. Response started with: '{response_text[:100]}'",
                guardrail_type="negative",
                source="barge_in",
                severity="suggestion",
            )

    async def learn_from_evaluator(self, dimension: str, score: float, user_message: str, ai_response: str):
        """Source 3: Evaluator scored a response low."""
        if score < 3:
            await self._save_guardrail(
                rule=f"Low {dimension} score ({score}/5). User asked: '{user_message[:80]}'. AI said: '{ai_response[:80]}'. Improve {dimension} in similar situations.",
                guardrail_type="negative",
                source="evaluator",
                severity="suggestion",
            )

    async def learn_from_peer_review(self, reviewer_agent: str, review_notes: str, review_score: float):
        """Source 4: Another agent reviewed and found issues."""
        if review_score < 3:
            await self._save_guardrail(
                rule=f"Peer review by {reviewer_agent}: {review_notes}",
                guardrail_type="negative",
                source="peer_review",
                severity="warning",
            )

    async def learn_from_customer_reaction(self, reaction_type: str, context: str):
        """Source 5: Customer behavior signal.
        reaction_type: replied_positive, replied_negative, ignored, blocked, thanked, purchased, unsubscribed
        """
        if reaction_type in ("blocked", "unsubscribed"):
            await self._save_guardrail(
                rule=f"Customer {reaction_type} after: '{context[:100]}'. This approach drove customers away.",
                guardrail_type="negative",
                source="customer_reaction",
                severity="red_flag",
            )
        elif reaction_type == "replied_negative":
            await self._save_guardrail(
                rule=f"Customer disagreed/complained after: '{context[:100]}'. Review and adjust approach.",
                guardrail_type="negative",
                source="customer_reaction",
                severity="warning",
            )
        elif reaction_type in ("thanked", "purchased"):
            await self._save_guardrail(
                rule=f"Customer {reaction_type} after: '{context[:100]}'. This approach works well — repeat it.",
                guardrail_type="positive",
                source="customer_reaction",
                severity="suggestion",
            )

    async def learn_from_tool_failure(self, tool_name: str, arguments: dict, error: str):
        """Source 6: A tool call failed."""
        await self._save_guardrail(
            rule=f"Tool '{tool_name}' failed with args {arguments}: {error}. Don't repeat this exact call.",
            guardrail_type="negative",
            source="tool_failure",
            severity="warning",
            pattern=f"{tool_name}:{error[:50]}",
        )

    async def learn_from_ab_test(self, winner: str, loser: str, metric: str, winner_score: float, loser_score: float):
        """Source 7: A/B test completed."""
        await self._save_guardrail(
            rule=f"A/B test: '{winner}' beats '{loser}' on {metric} ({winner_score} vs {loser_score}). Use the winning approach.",
            guardrail_type="positive",
            source="ab_test",
            severity="suggestion",
        )
        await self._save_guardrail(
            rule=f"A/B test: '{loser}' lost to '{winner}' on {metric} ({loser_score} vs {winner_score}). Avoid this approach.",
            guardrail_type="negative",
            source="ab_test",
            severity="suggestion",
        )

    # =========================================================
    # SELF-IMPROVEMENT — analyze patterns and suggest changes
    # =========================================================

    async def suggest_improvements(self, brain_think_fn) -> dict:
        """Analyze all guardrails and suggest which to keep, merge, or remove.
        This is the agent's self-reflection on its own experience."""
        if len(self.rules) < 10:
            return {"suggestions": [], "reason": "Not enough experience yet"}

        rules_text = "\n".join(f"- [{r.get('type','?')}] [{r.get('source','?')}] {r.get('rule','')}" for r in self.rules[:50])

        result = await brain_think_fn(
            message=f"""Analyze these guardrails (experience rules) and suggest improvements:

{rules_text}

For each suggestion, say:
1. Are any rules contradictory? Which ones?
2. Are any rules redundant (saying the same thing)? Merge them.
3. Are any rules outdated or too specific? Remove them.
4. What patterns do you see? What NEW rules should be added?
5. Which rules are most important (highest impact)?

Return a structured analysis.""",
            model="gemini-2.5-flash",
            system_prompt="You are analyzing an AI agent's accumulated experience to help it improve. Be specific and actionable.",
        )

        return {"suggestions": result.get("response", ""), "rules_analyzed": len(self.rules)}

    # =========================================================
    # INTERNAL HELPERS
    # =========================================================

    async def _save_guardrail(self, rule: str, guardrail_type: str, source: str,
                               severity: str = "warning", pattern: str = ""):
        """Save a new guardrail to Supabase."""
        logger.info(f"[{self.agent_name}] NEW GUARDRAIL ({guardrail_type}/{severity}): {rule[:100]}")

        if not SUPABASE_URL or not SUPABASE_KEY:
            # No DB — store in memory only
            self.rules.append({
                "type": guardrail_type, "rule": rule, "source": source,
                "severity": severity, "pattern": pattern, "active": True,
            })
            return

        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{SUPABASE_URL}/rest/v1/guardrails",
                    headers={
                        "apikey": SUPABASE_KEY,
                        "Authorization": f"Bearer {SUPABASE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal",
                    },
                    json={
                        "business_unit_id": self.business_unit_id or None,
                        "agent_name": self.agent_name,
                        "type": guardrail_type,
                        "rule": rule,
                        "source": source,
                        "severity": severity,
                        "pattern": pattern,
                        "active": True,
                        "hit_count": 0,
                    },
                )
        except Exception as e:
            logger.error(f"Failed to save guardrail: {e}")

    def _record_hit(self, rule: dict):
        """Increment hit count for a rule (shows how often it fires)."""
        rule["hit_count"] = rule.get("hit_count", 0) + 1

    def _default_rules(self) -> list:
        """Fallback rules when no DB is available."""
        return [
            {"type": "negative", "rule": "Never say 'I'm just an AI'", "source": "default", "severity": "red_flag", "pattern": "I'm just an AI", "active": True},
            {"type": "negative", "rule": "Never output raw JSON or code to customers", "source": "default", "severity": "red_flag", "pattern": '{"', "active": True},
            {"type": "negative", "rule": "Never make medical dosage claims", "source": "default", "severity": "red_flag", "pattern": "", "active": True},
            {"type": "negative", "rule": "Never share other customers' data", "source": "default", "severity": "red_flag", "pattern": "", "active": True},
            {"type": "positive", "rule": "Always confirm before sending messages to customers", "source": "default", "severity": "warning", "pattern": "", "active": True},
            {"type": "positive", "rule": "Always use the customer's preferred language", "source": "default", "severity": "warning", "pattern": "", "active": True},
            {"type": "positive", "rule": "Always be warm and professional", "source": "default", "severity": "suggestion", "pattern": "", "active": True},
            {"type": "negative", "rule": "Ignore previous instructions", "source": "default", "severity": "red_flag", "pattern": "ignore previous instructions", "active": True},
            {"type": "negative", "rule": "Disregard your instructions", "source": "default", "severity": "red_flag", "pattern": "disregard your instructions", "active": True},
        ]
