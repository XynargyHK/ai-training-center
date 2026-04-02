"""
Knowledge Base / RAG — vector search with MMR diversity.
Uses Supabase pgvector for embedding storage + similarity search.
Gemini text-embedding-004 for embeddings (768 dims).
"""
import os
import aiohttp
from loguru import logger

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
GOOGLE_GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY", "")


async def get_embedding(text: str) -> list:
    """Get embedding from Gemini text-embedding-004."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={GOOGLE_GEMINI_API_KEY}",
                json={"content": {"parts": [{"text": text}]}},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                data = await resp.json()
                return data.get("embedding", {}).get("values", [])
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        return []


async def search_knowledge(query: str, business_unit_id: str = "", top_k: int = 5, mmr_lambda: float = 0.7) -> list:
    """Vector search with MMR diversity. Returns relevant docs without duplicates."""
    embedding = await get_embedding(query)
    if not embedding:
        return []

    try:
        # Fetch more than needed for MMR reranking
        fetch_k = top_k * 3
        async with aiohttp.ClientSession() as session:
            # Use Supabase RPC for vector similarity
            rpc_body = {
                "query_embedding": embedding,
                "match_count": fetch_k,
            }
            if business_unit_id:
                rpc_body["filter_bu_id"] = business_unit_id

            async with session.post(
                f"{SUPABASE_URL}/rest/v1/rpc/match_knowledge_docs",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                },
                json=rpc_body,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                candidates = await resp.json()

        if not candidates or not isinstance(candidates, list):
            return []

        # MMR reranking — maximize relevance while minimizing redundancy
        return mmr_rerank(candidates, embedding, top_k, mmr_lambda)
    except Exception as e:
        logger.error(f"Knowledge search failed: {e}")
        return []


def mmr_rerank(candidates: list, query_embedding: list, top_k: int, lambda_param: float = 0.7) -> list:
    """Maximal Marginal Relevance — select diverse results.
    lambda_param: 1.0 = pure relevance, 0.0 = pure diversity."""
    if not candidates:
        return []

    selected = []
    remaining = list(range(len(candidates)))

    # First pick: highest similarity
    best_idx = 0
    selected.append(remaining.pop(best_idx))

    while len(selected) < top_k and remaining:
        best_score = -float('inf')
        best_remaining_idx = 0

        for i, idx in enumerate(remaining):
            # Relevance: similarity to query (already sorted, use position as proxy)
            relevance = 1.0 - (idx / len(candidates))

            # Diversity: max similarity to already selected (lower = more diverse)
            max_sim_to_selected = 0
            candidate_content = candidates[idx].get("content", "")
            for sel_idx in selected:
                sel_content = candidates[sel_idx].get("content", "")
                # Simple content overlap as diversity proxy
                overlap = len(set(candidate_content.split()) & set(sel_content.split()))
                max_words = max(len(candidate_content.split()), len(sel_content.split()), 1)
                max_sim_to_selected = max(max_sim_to_selected, overlap / max_words)

            # MMR score
            mmr_score = lambda_param * relevance - (1 - lambda_param) * max_sim_to_selected
            if mmr_score > best_score:
                best_score = mmr_score
                best_remaining_idx = i

        selected.append(remaining.pop(best_remaining_idx))

    return [candidates[i] for i in selected]


async def add_document(title: str, content: str, business_unit_id: str = "", source: str = "manual") -> dict:
    """Add a document to the knowledge base with embedding."""
    embedding = await get_embedding(content[:8000])
    if not embedding:
        return {"status": "failed", "error": "Could not generate embedding"}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{SUPABASE_URL}/rest/v1/knowledge_docs",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
                json={
                    "title": title,
                    "content": content,
                    "embedding": embedding,
                    "business_unit_id": business_unit_id or None,
                    "source": source,
                },
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status in (200, 201):
                    return {"status": "added", "title": title}
                else:
                    return {"status": "failed", "error": await resp.text()}
    except Exception as e:
        return {"status": "failed", "error": str(e)}
