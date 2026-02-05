import { Request, Response, NextFunction } from 'express';
import { SIWEAuthService } from './siwe.service';

/**
 * Authentication Middleware
 * Validates JWT token and attaches user info to request
 */
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No authentication token provided',
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify JWT token
        const decoded = SIWEAuthService.verifySessionToken(token);

        if (!decoded) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
            return;
        }

        // Check if session exists in Redis
        const session = await SIWEAuthService.getSession(decoded.address);

        if (!session) {
            res.status(401).json({
                success: false,
                error: 'Session expired',
            });
            return;
        }

        // Attach user info to request
        (req as any).user = {
            address: decoded.address,
            did: decoded.did,
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed',
        });
    }
};

/**
 * Optional authentication middleware
 * Does not block if no token is provided
 */
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = SIWEAuthService.verifySessionToken(token);

            if (decoded) {
                const session = await SIWEAuthService.getSession(decoded.address);
                if (session) {
                    (req as any).user = {
                        address: decoded.address,
                        did: decoded.did,
                    };
                }
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};
