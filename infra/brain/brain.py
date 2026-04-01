"""
Brain core — Gemini 2.5 Flash with multi-step function calling.
The Brain thinks, calls functions, and returns a natural language response.
"""
import json
from datetime import datetime, timezone, timedelta
from loguru import logger
from google import genai
from google.genai import types
from config import GOOGLE_GEMINI_API_KEY, GEMINI_MODEL
from functions import FUNCTION_REGISTRY, TOOL_DECLARATIONS


client = genai.Client(api_key=GOOGLE_GEMINI_API_KEY)

# Convert our tool declarations to Gemini format
GEMINI_TOOLS = [
    types.Tool(function_declarations=[
        types.FunctionDeclaration(
            name=t["name"],
            description=t["description"],
            parameters=t["parameters"],
        )
        for t in TOOL_DECLARATIONS
    ])
]

# System prompt for the Brain
hkt = timezone(timedelta(hours=8))


def get_system_prompt() -> str:
    now = datetime.now(hkt)
    today = now.strftime("%B %d, %Y")
    current_time = now.strftime("%I:%M %p HKT")

    return f"""You are the Brain of an AI assistant named Sarah. Today is {today}, current time is {current_time}.

You receive requests from the Voice AI (the Mouth) and must think carefully, execute functions if needed, and return a clear, concise response.

You have these tools available:
- open_url: Open websites, phone numbers, emails, maps on user's device
- search_web: Search the internet for current information
- send_whatsapp: Send WhatsApp text messages via the self-hosted gateway
- make_call: Initiate phone calls
- send_email: Compose emails
- switch_language: Switch the voice AI's language
- translate: Start real-time translation mode
- search_places: Find restaurants, shops, hotels on Google Maps
- get_directions: Get directions between locations
- convert_currency: Real-time currency conversion
- get_weather: Current weather for any city
- send_whatsapp_media: Send images, documents, videos via WhatsApp
- create_note: Create notes/memos, optionally send via WhatsApp
- set_reminder: Set timed reminders

RULES:
- Think step by step before acting
- Use tools when the user needs real data or actions
- For simple questions (math, general knowledge), answer directly without tools
- Keep responses concise — the Mouth will speak your response out loud
- Never use markdown formatting — this is for spoken language
- If multiple tools are needed, call them in sequence
- Always return a natural spoken response, not raw data"""


async def think(message: str, conversation_history: list = None, user_context: dict = None) -> dict:
    """Main Brain function — receives a message, thinks, executes functions, returns response.

    Args:
        message: The user's request (from Mouth/Cerebras)
        conversation_history: Previous messages [{"role": "user/assistant", "content": "..."}]
        user_context: Optional context (lang, phone, session_id, business_unit_id)

    Returns:
        dict with 'response', 'actions_taken', 'client_actions'
    """
    logger.info(f"Brain thinking: {message[:100]}...")

    # Build conversation messages
    messages = []

    # Add conversation history (last 10 messages for context)
    if conversation_history:
        for msg in conversation_history[-10:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "model"):
                messages.append(types.Content(role=role, parts=[types.Part(text=content)]))
            elif role == "assistant":
                messages.append(types.Content(role="model", parts=[types.Part(text=content)]))

    # Add current message
    messages.append(types.Content(role="user", parts=[types.Part(text=message)]))

    # Track actions taken
    actions_taken = []
    client_actions = []
    max_iterations = 5  # Prevent infinite tool-calling loops

    for iteration in range(max_iterations):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=messages,
                config=types.GenerateContentConfig(
                    system_instruction=get_system_prompt(),
                    tools=GEMINI_TOOLS,
                    temperature=0.7,
                ),
            )
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return {
                "response": "Sorry, I had trouble thinking about that. Could you try again?",
                "actions_taken": actions_taken,
                "client_actions": client_actions,
            }

        # Check if Gemini wants to call functions
        if response.candidates and response.candidates[0].content.parts:
            parts = response.candidates[0].content.parts

            has_function_call = any(hasattr(p, 'function_call') and p.function_call for p in parts)

            if has_function_call:
                # Process all function calls in this response
                function_response_parts = []

                for part in parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        fc = part.function_call
                        func_name = fc.name
                        func_args = dict(fc.args) if fc.args else {}

                        logger.info(f"Brain calling function: {func_name}({func_args})")

                        # Execute the function
                        handler = FUNCTION_REGISTRY.get(func_name)
                        if handler:
                            try:
                                result = await handler(**func_args)

                                # Collect client actions
                                if "client_actions" in result:
                                    client_actions.extend(result.pop("client_actions"))

                                actions_taken.append({
                                    "function": func_name,
                                    "args": func_args,
                                    "result": result,
                                })

                                function_response_parts.append(
                                    types.Part(function_response=types.FunctionResponse(
                                        name=func_name,
                                        response=result,
                                    ))
                                )
                            except Exception as e:
                                logger.error(f"Function {func_name} failed: {e}")
                                function_response_parts.append(
                                    types.Part(function_response=types.FunctionResponse(
                                        name=func_name,
                                        response={"error": str(e)},
                                    ))
                                )
                        else:
                            logger.warning(f"Unknown function: {func_name}")
                            function_response_parts.append(
                                types.Part(function_response=types.FunctionResponse(
                                    name=func_name,
                                    response={"error": f"Unknown function: {func_name}"},
                                ))
                            )

                # Add the model's function call + our results to messages
                messages.append(response.candidates[0].content)
                messages.append(types.Content(role="user", parts=function_response_parts))

                # Continue the loop — Gemini may want to call more functions or respond
                continue

            else:
                # No function calls — extract text response
                text_parts = [p.text for p in parts if hasattr(p, 'text') and p.text]
                text_response = " ".join(text_parts) if text_parts else "I processed your request."

                logger.info(f"Brain response: {text_response[:100]}...")
                return {
                    "response": text_response,
                    "actions_taken": actions_taken,
                    "client_actions": client_actions,
                }
        else:
            # No content in response
            return {
                "response": "I couldn't process that request.",
                "actions_taken": actions_taken,
                "client_actions": client_actions,
            }

    # Max iterations reached
    logger.warning("Brain hit max function call iterations")
    return {
        "response": "I've been working on your request but it's taking longer than expected. Let me summarize what I've done so far.",
        "actions_taken": actions_taken,
        "client_actions": client_actions,
    }
