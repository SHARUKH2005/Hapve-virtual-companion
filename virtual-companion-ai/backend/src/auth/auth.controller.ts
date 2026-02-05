import { Request, Response } from 'express';
import { SIWEAuthService } from './siwe.service';
import { IdentityService } from '../services/identity.service';
import Joi from 'joi';

/**
 * Authentication Controller
 * Handles all authentication endpoints
 */
export class AuthController {
    /**
     * GET /auth/nonce
     * Generate a nonce for SIWE authentication
     */
    static async getNonce(req: Request, res: Response): Promise<void> {
        try {
            const schema = Joi.object({
                address: Joi.string().required().regex(/^0x[a-fA-F0-9]{40}$/),
            });

            const { error, value } = schema.validate(req.query);

            if (error) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid wallet address format',
                });
                return;
            }

            const { address } = value;

            // Validate Ethereum address
            if (!SIWEAuthService.isValidAddress(address)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid Ethereum address',
                });
                return;
            }

            // Generate nonce
            const nonce = await SIWEAuthService.generateNonce(address);

            res.json({
                success: true,
                nonce,
                expiresIn: 300, // 5 minutes
            });
        } catch (error) {
            console.error('Nonce generation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate nonce',
            });
        }
    }

    /**
     * POST /auth/verify
     * Verify SIWE signature and create session
     */
    static async verify(req: Request, res: Response): Promise<void> {
        try {
            const schema = Joi.object({
                message: Joi.object({
                    domain: Joi.string().required(),
                    address: Joi.string().required(),
                    statement: Joi.string().optional(),
                    uri: Joi.string().uri().required(),
                    version: Joi.string().required(),
                    chainId: Joi.number().required(),
                    nonce: Joi.string().required(),
                    issuedAt: Joi.string().isoDate().required(),
                    expirationTime: Joi.string().isoDate().optional(),
                    notBefore: Joi.string().isoDate().optional(),
                }).required(),
                signature: Joi.string().required(),
            });

            const { error, value } = schema.validate(req.body);

            if (error) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid request format',
                    details: error.details,
                });
                return;
            }

            const { message, signature } = value;

            // Verify signature
            const verificationResult = await SIWEAuthService.verifySignature(
                message,
                signature
            );

            if (!verificationResult.success) {
                res.status(401).json({
                    success: false,
                    error: verificationResult.error || 'Authentication failed',
                });
                return;
            }

            const address = verificationResult.address!;

            // Generate or retrieve DID
            const did = SIWEAuthService.generateDID(address);

            // Check if identity exists in database
            let identity = await IdentityService.getIdentityByAddress(address);

            if (!identity) {
                // Create new identity
                identity = await IdentityService.createIdentity({
                    walletAddress: address,
                    did,
                });
            }

            // Create session token
            const sessionToken = SIWEAuthService.createSessionToken(address, did);

            // Store session in Redis
            await SIWEAuthService.storeSession(address, {
                did,
                lastActivity: Date.now(),
            });

            res.json({
                success: true,
                data: {
                    address,
                    did,
                    token: sessionToken,
                    identity: {
                        id: identity.id,
                        createdAt: identity.createdAt,
                        isActive: identity.isActive,
                    },
                },
            });
        } catch (error) {
            console.error('Verification error:', error);
            res.status(500).json({
                success: false,
                error: 'Authentication failed',
            });
        }
    }

    /**
     * POST /auth/logout
     * Logout user and destroy session
     */
    static async logout(req: Request, res: Response): Promise<void> {
        try {
            const address = (req as any).user?.address;

            if (!address) {
                res.status(401).json({
                    success: false,
                    error: 'Not authenticated',
                });
                return;
            }

            // Destroy session
            await SIWEAuthService.destroySession(address);

            res.json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: 'Logout failed',
            });
        }
    }

    /**
     * GET /auth/session
     * Get current session info
     */
    static async getSession(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;

            if (!user) {
                res.status(401).json({
                    success: false,
                    error: 'Not authenticated',
                });
                return;
            }

            // Refresh session
            await SIWEAuthService.refreshSession(user.address);

            const identity = await IdentityService.getIdentityByAddress(user.address);

            res.json({
                success: true,
                data: {
                    address: user.address,
                    did: user.did,
                    identity: identity ? {
                        id: identity.id,
                        createdAt: identity.createdAt,
                        isActive: identity.isActive,
                    } : null,
                },
            });
        } catch (error) {
            console.error('Session retrieval error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get session',
            });
        }
    }
}
