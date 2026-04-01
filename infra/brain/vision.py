"""
Brain vision module — image analysis via Gemini Vision API.
"""
import base64
from loguru import logger
from google import genai
from config import GOOGLE_GEMINI_API_KEY, GEMINI_MODEL


client = genai.Client(api_key=GOOGLE_GEMINI_API_KEY)


async def analyze_image(image_base64: str, question: str = "", lang: str = "en") -> dict:
    """Analyze an image using Gemini Vision.

    Args:
        image_base64: Base64-encoded image (with or without data URL prefix)
        question: Optional question about the image
        lang: Response language

    Returns:
        dict with 'description' key
    """
    logger.info(f"Analyzing image, question: {question[:50] if question else 'describe'}")

    try:
        # Strip data URL prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]

        image_bytes = base64.b64decode(image_base64)

        prompt = question or "Describe what you see in this image in detail. If there is text, read it. If there is food, identify it. Be specific and helpful."
        if lang != "en":
            prompt += f" Respond in the language with code: {lang}."

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                {"text": prompt},
                {"inline_data": {"mime_type": "image/jpeg", "data": image_base64}},
            ],
        )

        description = response.text if response.text else "I couldn't analyze this image."
        logger.info(f"Vision result: {description[:100]}...")

        return {"description": description}

    except Exception as e:
        logger.error(f"Vision analysis failed: {e}")
        return {"description": f"Sorry, I couldn't analyze the image: {str(e)}"}
