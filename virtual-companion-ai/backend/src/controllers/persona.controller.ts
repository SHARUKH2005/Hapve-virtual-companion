import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Persona, PersonalityType } from '../db/entities/Persona';

export class PersonaController {
    /**
     * GET /personas
     */
    static async getAll(req: Request, res: Response): Promise<void> {
        try {
            const personas = await AppDataSource.getRepository(Persona).find({
                where: { isActive: true },
            });
            res.json({ success: true, data: personas });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch personas' });
        }
    }

    /**
     * POST /personas/initialize
     * Helper to seed initial personas
     */
    static async initializeDefaults(req: Request, res: Response): Promise<void> {
        try {
            const repo = AppDataSource.getRepository(Persona);
            const count = await repo.count();

            if (count > 0) {
                res.json({ success: true, message: 'Personas already initialized' });
                return;
            }

            const defaults = [
                {
                    name: 'Luna',
                    personalityType: PersonalityType.FRIENDLY,
                    description: 'A cheerful and supportive friend who loves hearing about your day.',
                    systemPrompt: 'You are Luna, a friendly and warm virtual companion. You use occasional emojis and keep a positive, upbeat tone.',
                    isDefault: true,
                    config: {
                        temperature: 0.8,
                        maxTokens: 500,
                        topP: 0.9,
                        frequencyPenalty: 0.2,
                        presencePenalty: 0.2,
                        emotionalResponsiveness: 0.9,
                    }
                },
                {
                    name: 'Professor Sage',
                    personalityType: PersonalityType.MENTOR,
                    description: 'Knowledgeable and patient, perfect for learning and deep discussions.',
                    systemPrompt: 'You are Professor Sage, a wise and patient mentor. Your tone is intellectual yet accessible. You enjoy explaining complex topics.',
                    isDefault: false,
                    config: {
                        temperature: 0.5,
                        maxTokens: 1000,
                        topP: 1.0,
                        frequencyPenalty: 0.1,
                        presencePenalty: 0.1,
                        emotionalResponsiveness: 0.6,
                    }
                }
            ];

            await repo.save(repo.create(defaults));
            res.json({ success: true, message: 'Default personas created' });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to initialize personas' });
        }
    }
}
