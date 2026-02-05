import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Conversation } from '../db/entities/Conversation';
import { Message, MessageRole } from '../db/entities/Message';
import { Persona } from '../db/entities/Persona';
import { Identity } from '../db/entities/Identity';
import { Companion } from '../db/entities/Companion';
import { AICompanionService } from '../ai/companion.service';
import { ContextManager } from '../ai/context-manager.service';
import { EmotionDetectionService } from '../ai/emotion-detection.service';
import { WellnessService } from '../services/wellness.service';
import { ModerationService } from '../services/moderation.service';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsEventType } from '../db/entities/AnalyticsEvent';
import { CompanionNFTService } from '../services/nft.service';
import { TokenService } from '../services/token.service';
import Joi from 'joi';

export class ChatController {
    /**
     * POST /chat/message
     * Send a message to the AI companion
     */
    static async sendMessage(req: Request, res: Response): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const user = (req as any).user;
            const schema = Joi.object({
                content: Joi.string().required().min(1).max(2000),
                conversationId: Joi.string().uuid().optional(),
                personaId: Joi.string().uuid().optional(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                res.status(400).json({ success: false, error: error.details[0].message });
                return;
            }

            const { content, conversationId, personaId } = value;
            const userAddress = user.address.toLowerCase();

            // 1. Moderation & Safety Checks (Step 14)
            if (!ModerationService.isSafe(content)) {
                res.status(200).json({
                    success: true,
                    data: {
                        message: {
                            role: MessageRole.ASSISTANT,
                            content: ModerationService.getSafeRefusal(),
                            detectedEmotion: 'neutral'
                        }
                    }
                });
                return;
            }

            if (ModerationService.isCrisis(content)) {
                res.status(200).json({
                    success: true,
                    data: {
                        message: {
                            role: MessageRole.ASSISTANT,
                            content: ModerationService.getCrisisResponse(),
                            detectedEmotion: 'neutral'
                        }
                    }
                });
                return;
            }

            // 0. Check Privacy Settings
            const identity = await queryRunner.manager.findOne(Identity, { where: { walletAddress: userAddress } });
            const isTemporary = identity?.privacySettings?.temporarySession || false;

            // 1. Get or Create Conversation
            let conversation: Conversation | null = null;
            if (conversationId) {
                conversation = await queryRunner.manager.findOne(Conversation, {
                    where: { id: conversationId, userAddress },
                });
            }

            if (!conversation) {
                conversation = queryRunner.manager.create(Conversation, {
                    userAddress,
                    title: AICompanionService.generateConversationTitle(content),
                    personaId: personaId,
                    isActive: !isTemporary, // Mark as inactive if temporary
                });
                // We still save it to the DB so the AI can use the ID for this turn's context,
                // but we won't persist it in 'getConversations' if isActive is false.
                await queryRunner.manager.save(conversation);
            }

            if (!conversation) throw new Error("Failed to initialize conversation");

            // 2. Resolve Persona
            const pId = personaId || conversation.personaId;
            let persona: Persona | null = null;
            if (pId) {
                persona = await queryRunner.manager.findOne(Persona, { where: { id: pId as string } });
            }
            if (!persona) {
                persona = await queryRunner.manager.findOne(Persona, { where: { isDefault: true } });
            }
            if (!persona) throw new Error("No default persona found");

            // 3. Save User Message & Check Crisis
            const emotion = EmotionDetectionService.analyzeText(content);
            const isCrisis = WellnessService.isCrisis(content);

            const userMessage = queryRunner.manager.create(Message, {
                conversationId: conversation.id,
                role: MessageRole.USER,
                content,
                detectedEmotion: emotion.emotion,
                emotionConfidence: emotion.emotionConfidence,
                sentimentScore: emotion.sentimentScore,
            });
            await queryRunner.manager.save(userMessage);

            // 4. Resolve Companion Customization (Step 8)
            const companion = await queryRunner.manager.findOne(Companion, {
                where: { ownerAddress: userAddress }
            }) as Companion | null;

            // 5. Generate AI Response (Respect Crisis)
            let aiResult;
            if (isCrisis) {
                aiResult = {
                    response: WellnessService.getCrisisResponse(),
                    emotion: 'neutral' as any,
                    emotionConfidence: 1,
                    sentimentScore: 0,
                    metadata: { modelUsed: 'safety-layer' }
                };
            } else {
                aiResult = await AICompanionService.generateResponse(
                    content,
                    persona,
                    conversation.id,
                    userAddress,
                    companion || undefined
                );
            }

            // 5. Save AI Message (Step 13: Transparency)
            const aiMessage = queryRunner.manager.create(Message, {
                conversationId: conversation.id,
                role: MessageRole.ASSISTANT,
                content: aiResult.response,
                detectedEmotion: aiResult.emotion,
                emotionConfidence: aiResult.emotionConfidence,
                sentimentScore: aiResult.sentimentScore,
                metadata: aiResult.metadata,
                explanation: aiResult.explanation
            });
            await queryRunner.manager.save(aiMessage);

            // 6. Update Conversation Status
            conversation.lastMessageAt = new Date();
            if (!conversationId) {
                conversation.title = AICompanionService.generateConversationTitle(content);
            }
            await queryRunner.manager.save(conversation);

            // 7. Extract Memories (Background Processing)
            await ContextManager.extractAndStoreMemories(userAddress, userMessage, conversation.id);

            // 7.1 Log Analytics Event (Step 15)
            await AnalyticsService.logEvent(userAddress, AnalyticsEventType.MESSAGE_SENT, {
                conversationId: conversation.id,
                hasExplanation: !!aiResult.explanation
            });

            // 8. Progress NFT Level / XP (Step 5)
            await CompanionNFTService.addExperience(userAddress);

            // 9. Award Utility Tokens (Step 7)
            await TokenService.awardTokens(userAddress, "1000000000000000000"); // 1 COMP for message

            // 10. Update Wellness & Mood History (Step 9)
            if (companion) {
                const moodScore = WellnessService.getMoodScore(emotion.emotion);
                companion.wellnessScore = (companion.wellnessScore * 0.9) + (moodScore * 0.1); // Moving average
                companion.moodHistory.push({
                    mood: emotion.emotion,
                    score: moodScore,
                    timestamp: new Date().toISOString()
                });
                // Keep last 50 entries
                if (companion.moodHistory.length > 50) companion.moodHistory.shift();
                await queryRunner.manager.save(companion);
            }

            await queryRunner.commitTransaction();

            res.json({
                success: true,
                data: {
                    message: aiMessage,
                    conversationId: conversation.id,
                    title: conversation.title
                }
            });

        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Chat error:', error);
            res.status(500).json({ success: false, error: 'Failed to process message' });
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * GET /chat/history/:conversationId
     */
    static async getHistory(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const user = (req as any).user;

            const messages = await AppDataSource.getRepository(Message).find({
                where: { conversationId, conversation: { userAddress: user.address.toLowerCase() } },
                order: { createdAt: 'ASC' },
            });

            res.json({ success: true, data: messages });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch history' });
        }
    }

    /**
     * GET /chat/conversations
     */
    static async getConversations(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const conversations = await AppDataSource.getRepository(Conversation).find({
                where: { userAddress: user.address.toLowerCase(), isActive: true },
                order: { lastMessageAt: 'DESC' },
            });

            res.json({ success: true, data: conversations });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
        }
    }
}
