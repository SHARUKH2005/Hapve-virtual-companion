import axios from 'axios';
import { Persona, PersonalityType } from '../db/entities/Persona';
import { EmotionType } from '../db/entities/Message';
import { EmotionDetectionService } from './emotion-detection.service';
import { ContextManager } from './context-manager.service';
import { SYSTEM_PROMPTS } from './prompts';
import { Companion } from '../db/entities/Companion';

/**
 * AI Companion Service
 * Main AI engine that generates responses
 */
export class AICompanionService {
    // You can integrate with OpenAI, local models, or your existing AirLLM
    private static readonly AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo';
    private static readonly AI_API_URL = process.env.AI_API_URL || 'http://localhost:8000/chat';
    private static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    /**
     * Generate AI response
     * @param userMessage - User's message
     * @param persona - AI personality configuration
     * @param conversationId - Conversation ID for context
     * @param userAddress - User wallet address
     * @returns AI response
     */
    static async generateResponse(
        userMessage: string,
        persona: Persona,
        conversationId: string,
        userAddress: string,
        companion?: Companion // Companion entity for customization (Step 8)
    ): Promise<{
        response: string;
        emotion: EmotionType;
        emotionConfidence: number;
        sentimentScore: number;
        metadata: {
            tokens?: number;
            latency?: number;
            modelUsed: string;
        };
        explanation: {
            intent: string;
            moodDetected: string;
            basePersonality: string;
            referencedMemories: string[];
        };
    }> {
        const startTime = Date.now();

        // Analyze user's emotion
        const emotionAnalysis = EmotionDetectionService.analyzeText(userMessage);

        // Build context from conversation history and memories
        const { contextPrompt, relevantMemories } = await ContextManager.buildContext(
            conversationId,
            userAddress,
            userMessage
        );

        // Get emotional response guidance
        const responseTone = EmotionDetectionService.getResponseTone(
            emotionAnalysis.emotion
        );

        // Build system prompt with personality
        const systemPrompt = this.buildSystemPrompt(
            persona,
            emotionAnalysis.emotion,
            responseTone,
            companion
        );

        // Build full prompt
        const fullPrompt = `${systemPrompt}\n\n${contextPrompt}`;

        // Generate response (integrate with your AI backend)
        let response: string;
        let tokensUsed = 0;

        try {
            // Option 1: Use OpenAI API
            if (this.OPENAI_API_KEY) {
                const result = await this.callOpenAI(fullPrompt, persona);
                response = result.response;
                tokensUsed = result.tokens;
            }
            // Option 2: Use local AI API (your existing backend)
            else {
                const result = await this.callLocalAI(fullPrompt, persona);
                response = result.response;
                tokensUsed = result.tokens;
            }
        } catch (error) {
            console.error('AI generation error:', error);
            // Fallback response
            response = this.getFallbackResponse(emotionAnalysis.emotion);
        }

        const latency = Date.now() - startTime;

        return {
            response,
            emotion: emotionAnalysis.emotion,
            emotionConfidence: emotionAnalysis.emotionConfidence,
            sentimentScore: emotionAnalysis.sentimentScore,
            metadata: {
                tokens: tokensUsed,
                latency,
                modelUsed: this.AI_MODEL,
            },
            explanation: {
                intent: "Conversational Response",
                moodDetected: emotionAnalysis.emotion,
                basePersonality: companion?.personality || persona.personalityType,
                referencedMemories: relevantMemories.map(m => m.summary || m.content.substring(0, 50) + '...')
            }
        };
    }

    /**
     * Build system prompt with personality and emotion awareness
     */
    /**
     * Build system prompt with modular framework (Step 0-15)
     */
    private static buildSystemPrompt(
        persona: Persona,
        userEmotion: EmotionType,
        responseTone: string,
        companion?: Companion
    ): string {
        let prompt = '';

        // 0. Base System Prompt
        prompt += `${SYSTEM_PROMPTS.BASE}\n\n`;

        // 1. Identity
        prompt += `# Identity Module:\n${SYSTEM_PROMPTS.IDENTITY}\n`;
        const name = companion?.name || persona.name;
        prompt += `- Your name is ${name}.\n\n`;

        // 2. Interaction & Personality
        prompt += `# Interaction Module:\n${SYSTEM_PROMPTS.INTERACTION}\n`;
        const personality = companion?.personality || persona.personalityType;
        prompt += `- Current Active Personality: ${personality}.\n`;
        if (companion?.responseStyle) {
            prompt += `- Preferred Response Style: ${companion.responseStyle}.\n`;
        }
        prompt += `- Persona Background: ${persona.description || 'Virtual Companion AI'}\n\n`;

        // 3-4. Memory & Privacy
        prompt += `# Memory & Privacy Module:\n${SYSTEM_PROMPTS.MEMORY}\n${SYSTEM_PROMPTS.PRIVACY}\n\n`;

        // 5-6. Blockchain & Smart Contracts
        prompt += `# Web3 Module:\n${SYSTEM_PROMPTS.OWNERSHIP}\n${SYSTEM_PROMPTS.SMART_CONTRACT}\n\n`;

        // 8-9. Customization & Wellness
        prompt += `# Behavioral Module:\n${SYSTEM_PROMPTS.CUSTOMIZATION}\n${SYSTEM_PROMPTS.WELLNESS}\n\n`;

        // 10. Multi-Modal Awareness
        prompt += `# Multi-Modal Guidelines:\n${SYSTEM_PROMPTS.MULTI_MODAL}\n`;
        prompt += `- Current Detected User Emotion: ${userEmotion}\n`;
        prompt += `- Recommended Tone: ${responseTone}\n\n`;

        // 13-14. Transparency & Moderation
        prompt += `# Ethics Module:\n${SYSTEM_PROMPTS.TRANSPARENCY}\n${SYSTEM_PROMPTS.MODERATION}\n\n`;

        // Add additional persona system prompt if it exists
        if (persona.systemPrompt) {
            prompt += `# Persona Specific Instructions:\n${persona.systemPrompt}\n\n`;
        }

        return prompt;
    }

    /**
     * Call OpenAI API
     */
    private static async callOpenAI(
        prompt: string,
        persona: Persona
    ): Promise<{ response: string; tokens: number }> {
        if (!this.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
        }

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: this.AI_MODEL,
                messages: [{ role: 'system', content: prompt }],
                temperature: persona.config.temperature,
                max_tokens: persona.config.maxTokens,
                top_p: persona.config.topP,
                frequency_penalty: persona.config.frequencyPenalty,
                presence_penalty: persona.config.presencePenalty,
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return {
            response: response.data.choices[0].message.content,
            tokens: response.data.usage.total_tokens,
        };
    }

    /**
     * Call local AI API (your existing backend)
     */
    private static async callLocalAI(
        prompt: string,
        persona: Persona
    ): Promise<{ response: string; tokens: number }> {
        try {
            const response = await axios.post(
                this.AI_API_URL,
                {
                    prompt,
                    temperature: persona.config.temperature,
                    max_tokens: persona.config.maxTokens,
                },
                {
                    timeout: 30000, // 30 seconds
                }
            );

            return {
                response: response.data.response || response.data.text,
                tokens: response.data.tokens || 0,
            };
        } catch (error) {
            console.error('Local AI API error:', error);
            throw error;
        }
    }

    /**
     * Get fallback response based on emotion
     */
    private static getFallbackResponse(emotion: EmotionType): string {
        const fallbacks: Record<EmotionType, string> = {
            [EmotionType.HAPPY]: "I'm glad you're feeling good! Tell me more!",
            [EmotionType.SAD]: "I'm here for you. Would you like to talk about it?",
            [EmotionType.ANGRY]: "I understand you're frustrated. Let's work through this together.",
            [EmotionType.FEARFUL]: "It's okay to feel worried. I'm here to support you.",
            [EmotionType.SURPRISED]: "That sounds interesting! What happened?",
            [EmotionType.DISGUSTED]: "I understand that's unpleasant. How can I help?",
            [EmotionType.NEUTRAL]: "I'm listening. Please go on.",
        };

        return fallbacks[emotion];
    }

    /**
     * Validate AI response
     * @param response - AI generated response
     * @returns Cleaned and validated response
     */
    static validateResponse(response: string): string {
        // Remove potential harmful content, offensive language, etc.
        let cleaned = response.trim();

        // Remove markdown artifacts if any
        cleaned = cleaned.replace(/^```.*\n?/gm, '').replace(/```$/g, '');

        // Ensure response is not too long
        const maxLength = 1000;
        if (cleaned.length > maxLength) {
            cleaned = cleaned.substring(0, maxLength) + '...';
        }

        // Ensure response is not empty
        if (cleaned.length === 0) {
            cleaned = "I apologize, but I couldn't formulate a proper response. Could you rephrase that?";
        }

        return cleaned;
    }

    /**
     * Generate conversation title based on content
     * @param firstMessage - First message in conversation
     * @returns Generated title
     */
    static generateConversationTitle(firstMessage: string): string {
        // Simple title generation (can be enhanced with AI)
        const words = firstMessage.split(' ').slice(0, 6);
        let title = words.join(' ');

        if (title.length > 50) {
            title = title.substring(0, 47) + '...';
        }

        return title || 'New Conversation';
    }
}
