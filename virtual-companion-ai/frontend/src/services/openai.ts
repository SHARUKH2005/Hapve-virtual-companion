import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    dangerouslyAllowBrowser: true // Required for client-side usage
});

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Chat with GPT-4
 */
export async function chatWithGPT4(
    userMessage: string,
    conversationHistory: Message[] = [],
    systemPrompt?: string
): Promise<string> {
    try {
        const messages: Message[] = [
            {
                role: 'system',
                content: systemPrompt || 'You are a helpful, friendly AI companion. Be conversational, empathetic, and engaging.'
            },
            ...conversationHistory,
            {
                role: 'user',
                content: userMessage
            }
        ];

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages,
            temperature: 0.7,
            max_tokens: 500,
            presence_penalty: 0.6,
            frequency_penalty: 0.3
        });

        return response.choices[0].message.content || 'I apologize, but I couldn\'t generate a response.';
    } catch (error) {
        console.error('[OpenAI] Error:', error);

        // Fallback to pattern matching if GPT-4 fails
        return getFallbackResponse(userMessage);
    }
}

/**
 * Fallback pattern matching (if GPT-4 fails or no API key)
 */
function getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Greetings
    if (lowerMessage.match(/\b(hi|hello|hey|greetings)\b/)) {
        return "Hello! I'm your AI companion. How can I help you today?";
    }

    // How are you
    if (lowerMessage.match(/how are you|how're you/)) {
        return "I'm doing great, thank you for asking! How are you feeling today?";
    }

    // Name
    if (lowerMessage.match(/what('s| is) your name|who are you/)) {
        return "I'm your AI companion, here to chat, help, and keep you company!";
    }

    // Help
    if (lowerMessage.match(/\b(help|assist|support)\b/)) {
        return "I'm here to help! You can chat with me, ask questions, or just have a conversation. What would you like to talk about?";
    }

    // Goodbye
    if (lowerMessage.match(/\b(bye|goodbye|see you|farewell)\b/)) {
        return "Goodbye! It was nice chatting with you. Come back anytime!";
    }

    // Default
    return "That's interesting! Tell me more about that.";
}

/**
 * Check if OpenAI API key is configured
 */
export function isOpenAIConfigured(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
}

/**
 * Get AI response (tries GPT-4, falls back to pattern matching)
 */
export async function getAIResponse(
    message: string,
    history: Message[] = [],
    personality?: string
): Promise<string> {
    // If API key configured, use GPT-4
    if (isOpenAIConfigured()) {
        const systemPrompt = personality
            ? `You are an AI companion with a ${personality} personality. Be conversational and engaging.`
            : undefined;

        return await chatWithGPT4(message, history, systemPrompt);
    }

    // Otherwise use fallback
    return getFallbackResponse(message);
}

/**
 * Generate character description using GPT-4
 */
export async function generateCharacterDescription(
    name: string,
    personality: string,
    traits: string[]
): Promise<string> {
    if (!isOpenAIConfigured()) {
        return `${name} is a ${personality} AI companion who is ${traits.join(', ')}.`;
    }

    try {
        const prompt = `Create a brief, engaging character description for an AI companion named ${name} with a ${personality} personality and these traits: ${traits.join(', ')}. Keep it under 100 words.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 150
        });

        return response.choices[0].message.content || `${name} is a ${personality} AI companion.`;
    } catch (error) {
        console.error('[OpenAI] Character description error:', error);
        return `${name} is a ${personality} AI companion who is ${traits.join(', ')}.`;
    }
}
