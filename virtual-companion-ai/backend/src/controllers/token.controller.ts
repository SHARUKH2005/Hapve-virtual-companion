import { Request, Response } from 'express';
import { TokenService } from '../services/token.service';

export class TokenController {
    /**
     * GET /tokens/balance
     */
    static async getBalance(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const balance = await TokenService.getBalance(user.address.toLowerCase());

            res.json({ success: true, balance });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch token balance' });
        }
    }

    /**
     * POST /tokens/claim-daily
     * Simple daily reward mechanism
     */
    static async claimDaily(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            // In a real app, track last claim in DB
            const tx = await TokenService.awardTokens(user.address.toLowerCase(), "10000000000000000000"); // 10 COMP

            res.json({ success: true, txHash: tx, message: "Daily reward claimed!" });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to claim reward' });
        }
    }
}
