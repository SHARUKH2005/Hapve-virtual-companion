import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Companion } from '../db/entities/Companion';
import { Identity } from '../db/entities/Identity';
import { CompanionNFTService } from '../services/nft.service';
import Joi from 'joi';

export class CompanionController {
    /**
     * GET /companion/status
     * Get the current status, level, and XP of the user's companion
     */
    static async getStatus(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const companion = await AppDataSource.getRepository(Companion).findOne({
                where: { ownerAddress: user.address.toLowerCase() }
            });

            if (!companion) {
                res.json({ success: true, ownsCompanion: false });
                return;
            }

            res.json({
                success: true,
                ownsCompanion: true,
                data: companion
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch companion status' });
        }
    }

    /**
     * POST /companion/mint
     * Mint a new AI companion NFT for the user
     */
    static async mint(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const schema = Joi.object({
                name: Joi.string().required().min(2).max(50),
                avatarUrl: Joi.string().uri().optional()
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                res.status(400).json({ success: false, error: error.details[0].message });
                return;
            }

            const repo = AppDataSource.getRepository(Companion);
            const existing = await repo.findOne({ where: { ownerAddress: user.address.toLowerCase() } });

            if (existing) {
                res.status(400).json({ success: false, error: 'You already own a companion' });
                return;
            }

            const identity = await AppDataSource.getRepository(Identity).findOne({
                where: { walletAddress: user.address.toLowerCase() }
            });

            if (!identity) {
                res.status(404).json({ success: false, error: 'User identity not found' });
                return;
            }

            // 1. Create locally
            const companion = repo.create({
                name: value.name,
                avatarUrl: value.avatarUrl,
                ownerAddress: user.address.toLowerCase(),
                identity: identity,
                traits: { personality: "Cheerful", genesis: true }
            });

            await repo.save(companion);

            // 2. Trigger Blockchain Minting (Simulation for now)
            // In a real flow, the frontend would mint via MetaMask, and we'd listen for the event
            // Or we mint from backend (gasless/relayer style)
            companion.tokenId = Math.floor(Math.random() * 10000);
            await repo.save(companion);

            res.json({ success: true, message: 'Companion minted successfully!', data: companion });
        } catch (error) {
            console.error('Mint error:', error);
            res.status(500).json({ success: false, error: 'Failed to mint companion' });
        }
    }

    /**
     * PATCH /companion/customization
     * Update companion name, personality, and response style
     */
    static async updateCustomization(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const schema = Joi.object({
                name: Joi.string().min(2).max(50).optional(),
                personality: Joi.string().valid('friendly', 'mentor', 'professional', 'calm').optional(),
                responseStyle: Joi.string().valid('short', 'detailed', 'empathetic').optional(),
                customSettings: Joi.object({
                    voice: Joi.string().optional(),
                    language: Joi.string().optional(),
                    pitch: Joi.number().min(0.5).max(2.0).optional(),
                    style: Joi.string().optional()
                }).optional()
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                res.status(400).json({ success: false, error: error.details[0].message });
                return;
            }

            const repo = AppDataSource.getRepository(Companion);
            const companion = await repo.findOne({ where: { ownerAddress: user.address.toLowerCase() } });

            if (!companion) {
                res.status(404).json({ success: false, error: 'Companion not found' });
                return;
            }

            // Apply updates
            if (value.name) companion.name = value.name;
            if (value.personality) companion.personality = value.personality;
            if (value.responseStyle) companion.responseStyle = value.responseStyle;
            if (value.customSettings) {
                companion.customSettings = { ...companion.customSettings, ...value.customSettings };
            }

            await repo.save(companion);

            res.json({ success: true, message: 'Customization updated!', data: companion });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to update customization' });
        }
    }

    /**
     * POST /companion/generate-avatar
     * Generate 3D avatar from photo using Trellis
     */
    static async generateAvatar(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({ success: false, error: 'No image file provided' });
                return;
            }

            console.log('Generating avatar for file:', req.file.path);

            const { TrellisService } = await import('../services/trellis.service');
            const outputFilename = `avatar_${Date.now()}.glb`;

            // Call Python script
            const modelUrl = await TrellisService.generateAvatar(req.file.path, outputFilename);

            // Clean up uploaded file? (Optional, maybe keep for debug)
            // fs.unlinkSync(req.file.path); 

            res.json({
                success: true,
                data: {
                    modelUrl,
                    message: 'Avatar generated successfully!'
                }
            });

        } catch (error: any) {
            console.error('Avatar generation error:', error);
            res.status(500).json({ success: false, error: error.message || 'Failed to generate avatar' });
        }
    }
}
