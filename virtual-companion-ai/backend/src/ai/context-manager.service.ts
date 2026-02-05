import { AppDataSource } from '../config/database';
import { Message, MessageRole } from '../db/entities/Message';
import { Memory, MemoryType } from '../db/entities/Memory';
import { redisClient } from '../config/redis';

/**
 * Context Manager Service
 * Manages short-term (conversation) and long-term (memory) context
 */
export class ContextManager {
    private static readonly SHORT_TERM_WINDOW = 10; // Last N messages
    private static readonly CONTEXT_CACHE_TTL = 3600; // 1 hour

    /**
     * Get short-term context (recent messages from conversation)
     * @param conversationId - Conversation ID
     * @param limit - Number of recent messages
     * @returns Recent messages
     */
    static async getShortTermContext(
        conversationId: string,
        limit: number = this.SHORT_TERM_WINDOW
    ): Promise<Message[]> {
        const messageRepo = AppDataSource.getRepository(Message);

        const messages = await messageRepo.find({
            where: { conversationId },
            order: { createdAt: 'DESC' },
            take: limit,
        });

        return messages.reverse(); // Return in chronological order
    }

    /**
     * Get relevant long-term memories for user
     * @param userAddress - User wallet address
     * @param query - Optional query for semantic search
     * @param limit - Max memories to retrieve
     * @returns Relevant memories
     */
    static async getLongTermMemories(
        userAddress: string,
        query?: string,
        limit: number = 5
    ): Promise<Memory[]> {
        const memoryRepo = AppDataSource.getRepository(Memory);

        // Get most important and recently accessed memories
        const memories = await memoryRepo.find({
            where: {
                userAddress: userAddress.toLowerCase(),
                isActive: true,
            },
            order: {
                importance: 'DESC',
                lastAccessedAt: 'DESC',
            },
            take: limit,
        });

        // Update access count
        for (const memory of memories) {
            memory.accessCount++;
            memory.lastAccessedAt = new Date();
            await memoryRepo.save(memory);
        }

        return memories;
    }

    /**
     * Build combined context for AI prompt
     * @param conversationId - Conversation ID
     * @param userAddress - User address
     * @param currentMessage - Current user message
     * @returns Formatted context string
     */
    static async buildContext(
        conversationId: string,
        userAddress: string,
        currentMessage: string
    ): Promise<{
        contextPrompt: string;
        recentMessages: Message[];
        relevantMemories: Memory[];
    }> {
        // Try to get from cache first
        const cacheKey = `context:${conversationId}:${userAddress}`;
        const cached = await redisClient.get(cacheKey);

        let recentMessages: Message[];
        let relevantMemories: Memory[];

        if (cached) {
            const parsedCache = JSON.parse(cached);
            recentMessages = parsedCache.recentMessages;
            relevantMemories = parsedCache.relevantMemories;
        } else {
            // Get fresh context
            recentMessages = await this.getShortTermContext(conversationId);
            relevantMemories = await this.getLongTermMemories(userAddress);

            // Cache the context
            await redisClient.setEx(
                cacheKey,
                this.CONTEXT_CACHE_TTL,
                JSON.stringify({ recentMessages, relevantMemories })
            );
        }

        // Build context prompt
        let contextPrompt = '';

        // Add long-term memories if available
        if (relevantMemories.length > 0) {
            contextPrompt += '# Long-term Memories:\n';
            relevantMemories.forEach(memory => {
                contextPrompt += `- [${memory.memoryType}] ${memory.content}\n`;
            });
            contextPrompt += '\n';
        }

        // Add recent conversation history
        if (recentMessages.length > 0) {
            contextPrompt += '# Recent Conversation:\n';
            recentMessages.forEach(msg => {
                const role = msg.role === MessageRole.USER ? 'User' : 'Assistant';
                contextPrompt += `${role}: ${msg.content}\n`;
            });
            contextPrompt += '\n';
        }

        // Add current message
        contextPrompt += `# Current Message:\nUser: ${currentMessage}\n`;

        return {
            contextPrompt,
            recentMessages,
            relevantMemories,
        };
    }

    /**
     * Extract and store important information as memories
     * @param userAddress - User address
     * @param message - Message to analyze
     * @param conversationId - Conversation ID
     */
    static async extractAndStoreMemories(
        userAddress: string,
        message: Message,
        conversationId: string
    ): Promise<Memory[]> {
        const address = userAddress.toLowerCase();

        // 1. Check User Consent from Identity
        // Using a dynamic import or requiring directly to avoid circular dependency if any
        const { Identity } = require('../db/entities/Identity');
        const identityRepo = AppDataSource.getRepository(Identity);
        const identity = await identityRepo.findOne({ where: { walletAddress: address } });

        if (!identity || !identity.privacySettings?.memoryConsent) {
            console.log(`Memory storage skipped for ${address} (No consent)`);
            return [];
        }

        const memoryRepo = AppDataSource.getRepository(Memory);
        const memories: Memory[] = [];

        const content = message.content.toLowerCase();

        // Detect preferences (I like/love/hate...)
        const preferencePatterns = [
            /i (like|love|enjoy|prefer) (.*?)(?:\.|!|\?|$)/gi,
            /i (hate|dislike|don't like) (.*?)(?:\.|!|\?|$)/gi,
        ];

        for (const pattern of preferencePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const memory = memoryRepo.create({
                    userAddress: userAddress.toLowerCase(),
                    memoryType: MemoryType.PREFERENCE,
                    content: match[0],
                    summary: `User ${match[1]}s ${match[2]}`,
                    importance: 0.7,
                    conversationId,
                    messageId: message.id,
                });
                memories.push(await memoryRepo.save(memory));
            }
        }

        // Detect goals (I want to/I'm planning to...)
        const goalPatterns = [
            /i want to (.*?)(?:\.|!|\?|$)/gi,
            /i'm (planning|going|hoping) to (.*?)(?:\.|!|\?|$)/gi,
            /my goal is (.*?)(?:\.|!|\?|$)/gi,
        ];

        for (const pattern of goalPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const memory = memoryRepo.create({
                    userAddress: userAddress.toLowerCase(),
                    memoryType: MemoryType.GOAL,
                    content: match[0],
                    summary: `User's goal: ${match[1] || match[2]}`,
                    importance: 0.8,
                    conversationId,
                    messageId: message.id,
                });
                memories.push(await memoryRepo.save(memory));
            }
        }

        // Store highly emotional messages
        if (
            message.detectedEmotion &&
            message.emotionConfidence &&
            message.emotionConfidence > 0.7
        ) {
            const memory = memoryRepo.create({
                userAddress: userAddress.toLowerCase(),
                memoryType: MemoryType.EMOTION,
                content: message.content,
                summary: `User felt ${message.detectedEmotion}`,
                importance: message.emotionConfidence,
                conversationId,
                messageId: message.id,
            });
            memories.push(await memoryRepo.save(memory));
        }

        // Invalidate context cache
        const cacheKey = `context:${conversationId}:${userAddress}`;
        await redisClient.del(cacheKey);

        return memories;
    }

    /**
     * Clear context cache for conversation
     * @param conversationId - Conversation ID
     * @param userAddress - User address
     */
    static async clearContextCache(
        conversationId: string,
        userAddress: string
    ): Promise<void> {
        const cacheKey = `context:${conversationId}:${userAddress}`;
        await redisClient.del(cacheKey);
    }

    /**
     * Get conversation summary
     * @param conversationId - Conversation ID
     * @returns Summary of conversation
     */
    static async getConversationSummary(
        conversationId: string
    ): Promise<string> {
        const messages = await this.getShortTermContext(conversationId, 50);

        if (messages.length === 0) {
            return 'No messages in this conversation yet.';
        }

        // Simple summarization (can be enhanced with AI)
        const messageCount = messages.length;
        const userMessages = messages.filter(m => m.role === MessageRole.USER);
        const avgSentiment =
            userMessages.reduce((sum, m) => sum + (m.sentimentScore || 0), 0) /
            userMessages.length;

        const emotions = userMessages
            .filter(m => m.detectedEmotion)
            .map(m => m.detectedEmotion);
        const dominantEmotion = this.getMostFrequent(emotions);

        return `This conversation has ${messageCount} messages. Average sentiment: ${avgSentiment.toFixed(2)}. Dominant emotion: ${dominantEmotion || 'neutral'}.`;
    }

    /**
     * Helper: Get most frequent item in array
     */
    private static getMostFrequent<T>(arr: T[]): T | null {
        if (arr.length === 0) return null;

        const frequency: Record<string, number> = {};
        arr.forEach(item => {
            const key = String(item);
            frequency[key] = (frequency[key] || 0) + 1;
        });

        let maxFreq = 0;
        let mostFrequent: string | null = null;

        Object.entries(frequency).forEach(([item, freq]) => {
            if (freq > maxFreq) {
                maxFreq = freq;
                mostFrequent = item;
            }
        });

        return mostFrequent as T;
    }
}
