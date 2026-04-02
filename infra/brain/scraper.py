"""
Web Scraper — fetch and extract text from web pages.
Uses aiohttp + simple HTML parsing. No Puppeteer dependency.
For JS-heavy sites, can be upgraded to Playwright later.
"""
import re
import aiohttp
from loguru import logger

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


async def fetch_page(url: str, max_chars: int = 5000) -> dict:
    """Fetch a web page and extract clean text."""
    logger.info(f"Scraping: {url}")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status != 200:
                    return {"status": "failed", "error": f"HTTP {resp.status}"}
                html = await resp.text()

        # Extract text from HTML
        text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()

        # Extract title
        title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else url

        return {
            "status": "ok",
            "url": url,
            "title": title,
            "content": text[:max_chars],
            "full_length": len(text),
        }
    except Exception as e:
        logger.error(f"Scrape failed: {e}")
        return {"status": "failed", "error": str(e), "url": url}


async def scrape_and_store(url: str, business_unit_id: str = "") -> dict:
    """Scrape a page and add to knowledge base."""
    page = await fetch_page(url)
    if page["status"] != "ok":
        return page

    from knowledge import add_document
    result = await add_document(
        title=page["title"],
        content=page["content"],
        business_unit_id=business_unit_id,
        source=f"scrape:{url}",
    )
    return {**result, "url": url, "title": page["title"], "chars": len(page["content"])}
