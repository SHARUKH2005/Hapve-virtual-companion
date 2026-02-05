/**
 * GPT-4 AI Service - Integrated into Virtual Companion AI
 * Provides intelligent conversation with fallback to pattern matching
 */

import OpenAI from 'openai';

// Types
interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface AIResponse {
    text: string;
    emotion: 'neutral' | 'happy' | 'sad' | 'thinking' | 'surprised' | 'angry';
    source: 'gpt4' | 'fallback';
}

// Initialize OpenAI - will work if API key is set
let openai: OpenAI | null = null;

try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
        openai = new OpenAI({
            apiKey,
            dangerouslyAllowBrowser: true
        });
        console.log('[GPT-4] ✅ OpenAI client initialized');
    } else {
        console.log('[GPT-4] ⚠️ No API key - using fallback responses');
    }
} catch (error) {
    console.log('[GPT-4] ⚠️ OpenAI initialization failed - using fallback');
}

/**
 * Chat with GPT-4
 */
export async function chatWithGPT4(
    message: string,
    history: ChatMessage[] = [],
    personality: string = 'friendly'
): Promise<AIResponse> {
    // Try GPT-4 first
    if (openai) {
        try {
            const systemPrompt = `You are a helpful, ${personality} AI companion called HAPVE. 
You are warm, engaging, and supportive. Keep responses concise but meaningful.
Also detect the emotion of your response: neutral, happy, sad, thinking, surprised, or angry.
Format: [EMOTION:happy] Your response here`;

            const messages: ChatMessage[] = [
                { role: 'system', content: systemPrompt },
                ...history.slice(-10), // Last 10 messages for context
                { role: 'user', content: message }
            ];

            const response = await openai.chat.completions.create({
                model: 'gpt-4',
                messages,
                temperature: 0.7,
                max_tokens: 300
            });

            const content = response.choices[0].message.content || '';

            // Parse emotion from response
            const emotionMatch = content.match(/\[EMOTION:(\w+)\]/);
            const emotion = (emotionMatch?.[1] as AIResponse['emotion']) || 'neutral';
            const text = content.replace(/\[EMOTION:\w+\]\s*/g, '').trim();

            console.log('[GPT-4] ✅ Response received');
            return { text, emotion, source: 'gpt4' };
        } catch (error) {
            console.error('[GPT-4] Error:', error);
            // Fall through to fallback
        }
    }

    // Fallback pattern matching
    return getFallbackResponse(message);
}

/**
 * Pattern matching fallback
 */
function getFallbackResponse(message: string): AIResponse {
    const lower = message.toLowerCase();

    // Greetings
    if (lower.match(/\b(hi|hello|hey|greetings|good morning|good evening)\b/)) {
        return {
            text: "Hello! I'm your AI companion. How can I help you today?",
            emotion: 'happy',
            source: 'fallback'
        };
    }

    // How are you
    if (lower.match(/how are you|how('re| are) you doing/)) {
        return {
            text: "I'm doing great, thank you for asking! How about you?",
            emotion: 'happy',
            source: 'fallback'
        };
    }

    // Name
    if (lower.match(/what('s| is) your name|who are you/)) {
        return {
            text: "I'm HAPVE, your AI Virtual Companion. I'm here to chat, help, and keep you company!",
            emotion: 'neutral',
            source: 'fallback'
        };
    }

    // Help
    if (lower.match(/\b(help|what can you do|commands)\b/)) {
        return {
            text: "I can chat with you, answer questions, tell jokes, and provide companionship. Just talk to me naturally!",
            emotion: 'neutral',
            source: 'fallback'
        };
    }

    // Jokes
    if (lower.match(/\b(joke|funny|laugh|humor)\b/)) {
        const jokes = [
            "Why do programmers prefer dark mode? Because light attracts bugs! 😄",
            "Why did the AI break up with the database? Too many commitment issues!",
            "What do you call an AI that sings? Ariana Grandelta!"
        ];
        return {
            text: jokes[Math.floor(Math.random() * jokes.length)],
            emotion: 'happy',
            source: 'fallback'
        };
    }

    // Goodbye
    if (lower.match(/\b(bye|goodbye|see you|take care)\b/)) {
        return {
            text: "Goodbye! It was lovely chatting with you. Come back anytime!",
            emotion: 'happy',
            source: 'fallback'
        };
    }

    // Sad/down
    if (lower.match(/\b(sad|depressed|unhappy|down|lonely)\b/)) {
        return {
            text: "I'm sorry you're feeling that way. I'm here for you. Would you like to talk about it?",
            emotion: 'sad',
            source: 'fallback'
        };
    }

    // Happy
    if (lower.match(/\b(happy|excited|great|wonderful|amazing)\b/)) {
        return {
            text: "That's wonderful to hear! Your happiness makes me happy too! 🌟",
            emotion: 'happy',
            source: 'fallback'
        };
    }

    // Default
    return {
        text: "That's interesting! Tell me more about that.",
        emotion: 'thinking',
        source: 'fallback'
    };
}

/**
 * Check if GPT-4 is available
 */
export function isGPT4Available(): boolean {
    return openai !== null;
}

/**
 * Generate character description
 */
export async function generateCharacterBio(
    name: string,
    personality: string,
    traits: string[]
): Promise<string> {
    if (!openai) {
        return `${name} is a ${personality} AI companion who is ${traits.join(', ')}.`;
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{
                role: 'user',
                content: `Create a brief, engaging bio for an AI companion named ${name} with ${personality} personality and traits: ${traits.join(', ')}. Keep it under 50 words.`
            }],
            temperature: 0.8,
            max_tokens: 100
        });

        return response.choices[0].message.content || `${name} is a ${personality} AI companion.`;
    } catch (error) {
        return `${name} is a ${personality} AI companion who is ${traits.join(', ')}.`;
    }
}

export default { chatWithGPT4, isGPT4Available, generateCharacterBio };
