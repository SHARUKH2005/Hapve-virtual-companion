import json
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

MEMORY_FILE = "companion_memory.json"

class CompanionMemory:
    """
    Long-term memory and personality evolution system.
    Designed for low-spec hardware (JSON-based) but simulates complex ML growth.
    """
    def __init__(self):
        self.memory_path = MEMORY_FILE
        self.data = self._load_memory()

    def _load_memory(self):
        if os.path.exists(self.memory_path):
            with open(self.memory_path, 'r') as f:
                return json.load(f)
        return {
            "user_info": {"name": "User", "interests": []},
            "chat_history": [],
            "personality": {
                "level": 1,
                "experience": 0,
                "traits": {"friendliness": 0.5, "intellect": 0.5, "humor": 0.5},
                "mood": "neutral"
            },
            "last_interaction": None
        }

    def save_interaction(self, user_text, ai_response):
        # 1. Store the chat
        interaction = {
            "timestamp": datetime.now().isoformat(),
            "user": user_text,
            "ai": ai_response
        }
        self.data["chat_history"].append(interaction)
        
        # Keep memory efficient - keep last 50 interactions for context
        if len(self.data["chat_history"]) > 50:
            self.data["chat_history"].pop(0)

        # 2. Simulate "Evolution" (ML growth)
        self.data["personality"]["experience"] += 10
        if self.data["personality"]["experience"] >= 100:
            self.data["personality"]["level"] += 1
            self.data["personality"]["experience"] = 0
            logger.info(f"Companion evolved to Level {self.data['personality']['level']}!")

        # 3. Simple Sentiment-based trait development
        if any(word in user_text.lower() for word in ["haha", "lol", "funny", "joke"]):
            self.data["personality"]["traits"]["humor"] += 0.01
        if any(word in user_text.lower() for word in ["how", "why", "science", "code"]):
            self.data["personality"]["traits"]["intellect"] += 0.01

        self.data["last_interaction"] = datetime.now().isoformat()
        self._save_to_disk()

    def _save_to_disk(self):
        with open(self.memory_path, 'w') as f:
            json.dump(self.data, f, indent=2)

    def get_context(self):
        """Returns string for GPT prompt including personality and relevant history"""
        p = self.data["personality"]
        traits = p["traits"]
        
        context = f"You are an evolving AI companion at Level {p['level']}. "
        context += f"Your traits: Friendliness: {traits['friendliness']:.2f}, Humor: {traits['humor']:.2f}, Intellect: {traits['intellect']:.2f}. "
        context += "Recent history:\n"
        
        # Add last 5 interactions as direct context
        for entry in self.data["chat_history"][-5:]:
            context += f"User: {entry['user']}\nAI: {entry['ai']}\n"
            
        return context

# Singleton
memory_mgr = CompanionMemory()
