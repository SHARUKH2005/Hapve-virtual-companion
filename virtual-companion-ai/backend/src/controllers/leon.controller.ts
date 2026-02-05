import { Request, Response } from 'express';
import { getLeonBackendService } from '../services/leon.service';

/**
 * Leon AI Controller
 * Handles API endpoints for Leon AI integration
 */

export class LeonController {
    private leonService = getLeonBackendService();

    /**
     * Initialize Leon AI connection
     */
    async initialize(req: Request, res: Response): Promise<void> {
        try {
            await this.leonService.connect();
            res.json({
                success: true,
                message: 'Leon AI connected successfully'
            });
        } catch (error) {
            console.error('[Leon Controller] Initialization error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to connect to Leon AI',
                error: (error as Error).message
            });
        }
    }

    /**
     * Send query to Leon AI
     */
    async query(req: Request, res: Response): Promise<void> {
        try {
            const { text, userId } = req.body;

            if (!text) {
                res.status(400).json({
                    success: false,
                    message: 'Text is required'
                });
                return;
            }

            const response = await this.leonService.query(text, userId);

            res.json({
                success: true,
                data: response
            });
        } catch (error) {
            console.error('[Leon Controller] Query error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process query',
                error: (error as Error).message
            });
        }
    }

    /**
     * Text-to-Speech endpoint
     */
    async textToSpeech(req: Request, res: Response): Promise<void> {
        try {
            const { text } = req.body;

            if (!text) {
                res.status(400).json({
                    success: false,
                    message: 'Text is required'
                });
                return;
            }

            const audioBuffer = await this.leonService.textToSpeech(text);

            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('Content-Length', audioBuffer.length);
            res.send(audioBuffer);
        } catch (error) {
            console.error('[Leon Controller] TTS error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate speech',
                error: (error as Error).message
            });
        }
    }

    /**
     * Speech-to-Text endpoint
     */
    async speechToText(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'Audio file is required'
                });
                return;
            }

            const text = await this.leonService.speechToText(req.file.buffer);

            res.json({
                success: true,
                text
            });
        } catch (error) {
            console.error('[Leon Controller] STT error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to transcribe speech',
                error: (error as Error).message
            });
        }
    }

    /**
     * Get available Leon skills
     */
    async getSkills(req: Request, res: Response): Promise<void> {
        try {
            const skills = await this.leonService.getSkills();

            res.json({
                success: true,
                skills
            });
        } catch (error) {
            console.error('[Leon Controller] Get skills error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get skills',
                error: (error as Error).message
            });
        }
    }

    /**
     * Check Leon AI health status
     */
    async healthCheck(req: Request, res: Response): Promise<void> {
        try {
            const isHealthy = await this.leonService.checkHealth();
            const isConnected = this.leonService.isLeonConnected();

            res.json({
                success: true,
                status: {
                    healthy: isHealthy,
                    connected: isConnected
                }
            });
        } catch (error) {
            console.error('[Leon Controller] Health check error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check Leon AI health',
                error: (error as Error).message
            });
        }
    }

    /**
     * Get Leon AI status
     */
    async getStatus(req: Request, res: Response): Promise<void> {
        try {
            const isConnected = this.leonService.isLeonConnected();

            res.json({
                success: true,
                connected: isConnected,
                message: isConnected ? 'Leon AI is connected' : 'Leon AI is not connected'
            });
        } catch (error) {
            console.error('[Leon Controller] Status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get status',
                error: (error as Error).message
            });
        }
    }
}

export default new LeonController();
