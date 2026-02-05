import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Memory } from '../db/entities/Memory';
import { MemorySecurity } from '../utils/security';
import { BlockchainService } from '../services/blockchain.service';
import Joi from 'joi';

export class MemoryController {
    /**
     * GET /memories
     * Retrieve all memories for the user
     */
    static async getUserMemories(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const memories = await AppDataSource.getRepository(Memory).find({
                where: { userAddress: user.address.toLowerCase(), isActive: true },
                order: { importance: 'DESC', createdAt: 'DESC' }
            });

            res.json({ success: true, data: memories });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch memories' });
        }
    }

    /**
     * PATCH /memories/:id
     * Edit stored memory (e.g., correcting a preference)
     */
    static async updateMemory(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { content } = req.body;
            const user = (req as any).user;

            const repo = AppDataSource.getRepository(Memory);
            const memory = await repo.findOne({ where: { id, userAddress: user.address.toLowerCase() } });

            if (!memory) {
                res.status(404).json({ success: false, error: 'Memory not found' });
                return;
            }

            memory.content = content;
            memory.updatedAt = new Date();

            // If encrypted, re-encrypt would happen here
            // For now we update the plain content in this version
            await repo.save(memory);

            // Re-hash for blockchain integrity if important enough
            if (memory.importance > 0.8) {
                const hash = MemorySecurity.formatForSolidity(MemorySecurity.generateHash(content));
                await BlockchainService.storeMemoryHashOnChain(user.address, hash);
            }

            res.json({ success: true, data: memory });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to update memory' });
        }
    }

    /**
     * DELETE /memories/:id
     * Fully delete a memory as per privacy rights
     */
    static async deleteMemory(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            const repo = AppDataSource.getRepository(Memory);
            const memory = await repo.findOne({ where: { id, userAddress: user.address.toLowerCase() } });

            if (!memory) {
                res.status(404).json({ success: false, error: 'Memory not found' });
                return;
            }

            // Hard or soft delete depending on preference
            await repo.remove(memory);

            res.json({ success: true, message: 'Memory deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to delete memory' });
        }
    }

    /**
     * POST /memories/summary
     * Manually trigger a conversation summary
     */
    static async createManualSummary(req: Request, res: Response): Promise<void> {
        // Integration with AI summarization would go here
        res.status(501).json({ success: false, error: 'AI Summarization feature coming in Step 4/5 integration' });
    }
}
