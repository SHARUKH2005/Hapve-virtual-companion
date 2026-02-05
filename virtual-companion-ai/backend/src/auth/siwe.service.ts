import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { redisClient } from '../config/redis';

/**
 * SIWE Authentication Service
 * Handles Sign-In With Ethereum authentication flow
 */
export class SIWEAuthService {
    private static readonly NONCE_EXPIRY = 5 * 60; // 5 minutes
    private static readonly SESSION_EXPIRY = 7 * 24 * 60 * 60; // 7 days
    private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

    /**
     * Generate a cryptographic nonce for SIWE
     * @param address - Wallet address
     * @returns Nonce string
     */
    static async generateNonce(address: string): Promise<string> {
        const nonce = crypto.randomBytes(32).toString('hex');

        // Store nonce in Redis with expiry
        const key = `nonce:${address.toLowerCase()}`;
        await redisClient.setEx(key, this.NONCE_EXPIRY, nonce);

        return nonce;
    }

    /**
     * Verify a SIWE message and signature
     * @param message - SIWE message object
     * @param signature - Signature from wallet
     * @returns Verification result with address
     */
    static async verifySignature(
        message: Partial<SiweMessage>,
        signature: string
    ): Promise<{ success: boolean; address?: string; error?: string }> {
        try {
            // Create SIWE message
            const siweMessage = new SiweMessage(message);

            // Get stored nonce
            const address = message.address?.toLowerCase();
            if (!address) {
                return { success: false, error: 'Address is required' };
            }

            const storedNonce = await redisClient.get(`nonce:${address}`);

            if (!storedNonce) {
                return { success: false, error: 'Nonce expired or invalid' };
            }

            if (storedNonce !== message.nonce) {
                return { success: false, error: 'Nonce mismatch' };
            }

            // Verify the signature
            const fields = await siweMessage.verify({ signature });

            if (!fields.success) {
                return { success: false, error: 'Signature verification failed' };
            }

            // Delete used nonce (prevent replay attacks)
            await redisClient.del(`nonce:${address}`);

            // Check if signature is recent (prevent replay)
            const messageTime = new Date(message.issuedAt || '').getTime();
            const now = Date.now();
            const timeDiff = Math.abs(now - messageTime);

            // Allow 10 minutes tolerance
            if (timeDiff > 10 * 60 * 1000) {
                return { success: false, error: 'Message timestamp too old' };
            }

            return {
                success: true,
                address: fields.data.address,
            };

        } catch (error) {
            console.error('SIWE verification error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Verification failed',
            };
        }
    }

    /**
     * Generate a DID from wallet address
     * @param address - Wallet address
     * @returns DID string
     */
    static generateDID(address: string): string {
        // Using did:ethr method (Ethereum DID)
        return `did:ethr:${address.toLowerCase()}`;
    }

    /**
     * Create a JWT session token
     * @param address - Wallet address
     * @param did - Decentralized identifier
     * @returns JWT token
     */
    static createSessionToken(address: string, did: string): string {
        const payload = {
            address: address.toLowerCase(),
            did,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.SESSION_EXPIRY,
        };

        return jwt.sign(payload, this.JWT_SECRET);
    }

    /**
     * Verify a JWT session token
     * @param token - JWT token
     * @returns Decoded payload or null
     */
    static verifySessionToken(token: string): {
        address: string;
        did: string;
        iat: number;
        exp: number;
    } | null {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as {
                address: string;
                did: string;
                iat: number;
                exp: number;
            };
            return decoded;
        } catch (error) {
            console.error('JWT verification failed:', error);
            return null;
        }
    }

    /**
     * Validate Ethereum address
     * @param address - Address to validate
     * @returns Boolean
     */
    static isValidAddress(address: string): boolean {
        return ethers.isAddress(address);
    }

    /**
     * Store session in Redis
     * @param address - Wallet address
     * @param sessionData - Session data
     */
    static async storeSession(
        address: string,
        sessionData: { did: string; lastActivity: number }
    ): Promise<void> {
        const key = `session:${address.toLowerCase()}`;
        await redisClient.setEx(
            key,
            this.SESSION_EXPIRY,
            JSON.stringify(sessionData)
        );
    }

    /**
     * Get session from Redis
     * @param address - Wallet address
     * @returns Session data or null
     */
    static async getSession(address: string): Promise<{
        did: string;
        lastActivity: number;
    } | null> {
        const key = `session:${address.toLowerCase()}`;
        const data = await redisClient.get(key);

        if (!data) return null;

        return JSON.parse(data);
    }

    /**
     * Destroy session
     * @param address - Wallet address
     */
    static async destroySession(address: string): Promise<void> {
        const key = `session:${address.toLowerCase()}`;
        await redisClient.del(key);
    }

    /**
     * Refresh session expiry
     * @param address - Wallet address
     */
    static async refreshSession(address: string): Promise<void> {
        const session = await this.getSession(address);
        if (session) {
            session.lastActivity = Date.now();
            await this.storeSession(address, session);
        }
    }
}
