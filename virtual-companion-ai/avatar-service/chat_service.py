"""
Simple chat service for the companion backend.

This provides a working /api/chat endpoint:
- If OPENAI_API_KEY is set, it uses OpenAI Chat Completions via HTTP.
- Otherwise it falls back to a lightweight local response generator.

This keeps the project functional end-to-end without forcing heavy dependencies.
"""

from __future__ import annotations

import os
import random
from typing import List, Dict, Any, Optional

import httpx


def _fallback_reply(message: str) -> str:
    msg = (message or "").strip()
    if not msg:
        return "Tell me what’s on your mind."

    lower = msg.lower()
    if any(k in lower for k in ["hello", "hi", "hey"]):
        return "Hi. I’m here with you. What would you like to talk about?"
    if "time" in lower:
        return "I can’t see your system clock from here, but I can help you plan your next steps."
    if any(k in lower for k in ["sad", "lonely", "depressed", "anxious"]):
        return "I’m here with you. Do you want to tell me what’s been hardest lately?"

    starters = [
        "I hear you.",
        "That makes sense.",
        "Thanks for sharing that with me.",
        "I’m listening.",
    ]
    followups = [
        "What’s the most important part of this for you?",
        "What would you like to happen next?",
        "Can you tell me a bit more?",
    ]
    return f"{random.choice(starters)} {random.choice(followups)}"


async def chat_reply(
    messages: List[Dict[str, Any]],
    system_prompt: Optional[str] = None,
) -> str:
    """
    messages: list of {role: 'user'|'assistant'|'system', content: string}
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # fallback to last user message
        last_user = next((m for m in reversed(messages) if m.get("role") == "user"), None)
        return _fallback_reply((last_user or {}).get("content", ""))

    # Minimal OpenAI-compatible call (works with OpenAI and many compatible gateways)
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

    payload_messages: List[Dict[str, str]] = []
    if system_prompt:
        payload_messages.append({"role": "system", "content": system_prompt})
    for m in messages[-20:]:
        role = m.get("role")
        content = m.get("content")
        if role in ("user", "assistant", "system") and isinstance(content, str):
            payload_messages.append({"role": role, "content": content})

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": payload_messages,
                "temperature": 0.7,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


