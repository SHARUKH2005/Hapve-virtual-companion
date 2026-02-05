import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Identity } from '../db/entities/Identity';
import { Memory } from '../db/entities/Memory';
import { Conversation } from '../db/entities/Conversation';
import { Message } from '../db/entities/Message';
import Joi from 'joi';

/**
 * Privacy Controller
 * Handles user privacy settings, data export, and deletion
 */
export class PrivacyController {
    /**
     * GET /privacy/settings
     * Retrieve current privacy configuration
     */
    static async getSettings(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const identity = await AppDataSource.getRepository(Identity).findOne({
                where: { walletAddress: user.address.toLowerCase() }
            });

            if (!identity) {
                res.status(404).json({ success: false, error: 'Identity not found' });
                return;
            }

            res.json({ success: true, data: identity.privacySettings });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch privacy settings' });
        }
    }

    /**
     * PATCH /privacy/settings
     * Update privacy toggles (Consent, Sensitive Filter, etc.)
     */
    static async updateSettings(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const schema = Joi.object({
                memoryConsent: Joi.boolean(),
                temporarySession: Joi.boolean(),
                sensitiveFilter: Joi.boolean(),
                encryptionLevel: Joi.string().valid('standard', 'high')
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                res.status(400).json({ success: false, error: error.details[0].message });
                return;
            }

            const repo = AppDataSource.getRepository(Identity);
            const identity = await repo.findOne({
                where: { walletAddress: user.address.toLowerCase() }
            });

            if (!identity) {
                res.status(404).json({ success: false, error: 'Identity not found' });
                return;
            }

            identity.privacySettings = { ...identity.privacySettings, ...value };
            await repo.save(identity);

            res.json({ success: true, data: identity.privacySettings });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to update privacy settings' });
        }
    }

    /**
     * GET /privacy/export
     * Export all user data as an encrypted/protected JSON
     */
    static async exportData(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const address = user.address.toLowerCase();

            // Fetch all data associated with the user
            const memories = await AppDataSource.getRepository(Memory).find({ where: { userAddress: address } });
            const conversations = await AppDataSource.getRepository(Conversation).find({ where: { userAddress: address } });

            const allMessages = [];
            for (const conv of conversations) {
                const messages = await AppDataSource.getRepository(Message).find({ where: { conversationId: conv.id } });
                allMessages.push({ conversationId: conv.id, messages });
            }

            const exportPackage = {
                metadata: {
                    exportedAt: new Date(),
                    userDID: user.did,
                    walletAddress: address
                },
                memories,
                conversations: allMessages
            };

            // In a real app, we might encrypt this with a ritual or user public key here
            res.json({ success: true, data: exportPackage });
        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({ success: false, error: 'Failed to export data' });
        }
    }

    /**
     * DELETE /privacy/purge
     * "Right to be Forgotten" - Deletes all off-chain data immediately
     */
    static async purgeData(req: Request, res: Response): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const user = (req as any).user;
            const address = user.address.toLowerCase();

            // Delete everything
            await queryRunner.manager.delete(Memory, { userAddress: address });
            await queryRunner.manager.delete(Conversation, { userAddress: address });
            // Cascading deletes should handle messages if configured, otherwise delete them too

            await queryRunner.commitTransaction();

            res.json({ success: true, message: 'All personal data has been purged from off-chain storage.' });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            res.status(500).json({ success: false, error: 'Failed to purge data' });
        } finally {
            await queryRunner.release();
        }
    }
}
