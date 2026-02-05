import g4f
from g4f.client import Client
from memory_service import memory_mgr
import logging

logger = logging.getLogger(__name__)

class G4FService:
    """
    High-performance LLM service with Long-Term Memory.
    """
    def __init__(self, model="gpt-4o"):
        self.client = Client()
        self.model = model

    def generate_response(self, prompt, personality_type="friendly", max_tokens=1000):
        try:
            # 1. Retrieve the 'Soul' and Context
            context = memory_mgr.get_context()
            
            # 2. Build the 'Thinking' prompt based on chosen personality
            system_soul = f"Your base personality is {personality_type}. "
            if personality_type == "professional":
                system_soul += "You are formal, efficient, and precise. "
            elif personality_type == "mentor":
                system_soul += "You are wise, patient, and use metaphors to teach. "
            elif personality_type == "funny":
                system_soul += "You are playful, crack jokes, and use humor. "
                
            full_prompt = f"{context}\n{system_soul}\nNow responding to current message: {prompt}\n(Remember to stay in character and reflect your evolution level.)"
            
            logger.info(f"Generating memory-aware response using g4f...")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": full_prompt}],
            )
            
            content = response.choices[0].message.content
            
            # 3. Save this interaction so the AI can grow
            memory_mgr.save_interaction(prompt, content)
            
            return content
            
        except Exception as e:
            logger.error(f"g4f Inference error: {str(e)}")
            # Fallback to a safer provider if the first one fails
            try:
                logger.info("Retrying with fallback provider...")
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.choices[0].message.content
            except Exception as final_e:
                return f"Error: gpt4free providers are currently busy. {str(final_e)}"

# Singleton instance
g4f_chat_service = G4FService()
