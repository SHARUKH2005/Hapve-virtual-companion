from airllm import AutoModel
import torch
import logging

logger = logging.getLogger(__name__)

class AirLLMChatService:
    """
    Implements the AirLLM concept: Running high-parameter models on low-spec hardware
    by executing inference layer-by-layer to minimize memory footprint.
    """
    def __init__(self, model_name="garage-bAInd/Platypus2-70B-instruct"):
        self.model_name = model_name
        self.model = None
        self.tokenizer = None

    def _ensure_loaded(self):
        if self.model is None:
            logger.info(f"Initializing AirLLM layer-wise inference for: {self.model_name}")
            try:
                # AutoModel from airllm handles the layer-by-layer logic automatically
                self.model = AutoModel.from_pretrained(self.model_name)
                self.tokenizer = self.model.tokenizer
            except Exception as e:
                logger.error(f"Failed to load AirLLM model: {str(e)}")
                raise

    def generate_response(self, prompt, personality_type="friendly", max_new_tokens=50):
        try:
            self._ensure_loaded()
            
            # Construct the System Prompt based on the "Soul"
            system_instruction = f"You are a {personality_type} AI companion."
            if personality_type == "professional":
                system_instruction += " Be concise, formal, and efficient."
            elif personality_type == "mentor":
                system_instruction += " Be wise, patient, and educational."
            elif personality_type == "funny":
                system_instruction += " Be humorous, playful, and crack jokes."
            elif personality_type == "flirty":
                system_instruction += " Be charming, affectionate, and playful."
            
            # Combine into a structured prompt for the 70B Model
            full_prompt = f"### System:\n{system_instruction}\n\n### User:\n{prompt}\n\n### Assistant:\n"
            
            input_tokens = self.tokenizer(
                [full_prompt],
                return_tensors="pt",
                return_attention_mask=False,
                truncation=True,
                max_length=512, # Increased for context
                padding=False
            )
            
            # Use GPU if available (even 4GB VRAM is enough for 70B with AirLLM!)
            device = "cuda" if torch.cuda.is_available() else "cpu"
            input_ids = input_tokens['input_ids'].to(device)
            
            logger.info(f"Generating AirLLM response (Device: {device})...")
            
            generation_output = self.model.generate(
                input_ids,
                max_new_tokens=max_new_tokens,
                use_cache=True,
                return_dict_in_generate=True
            )
            
            response = self.tokenizer.decode(generation_output.sequences[0], skip_special_tokens=True)
            return response
            
        except Exception as e:
            logger.error(f"AirLLM Inference error: {str(e)}")
            return f"Error: Could not generate response with AirLLM. {str(e)}"

# Singleton instance for the backend
chat_service = AirLLMChatService()
