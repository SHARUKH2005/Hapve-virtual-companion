import crypto from 'crypto';

/**
 * Memory Security Utility
 * Handles encryption for off-chain storage and hashing for on-chain verification
 */
export class MemorySecurity {
    private static readonly ALGORITHM = 'aes-256-gcm';
    private static readonly KEY = process.env.ENCRYPTION_KEY || 'your-fallback-32-byte-hex-string-for-dev';

    /**
     * Encrypt memory content
     */
    static encrypt(text: string): { encryptedData: string; iv: string; tag: string } {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.ALGORITHM, Buffer.from(this.KEY, 'hex'), iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return {
            encryptedData: encrypted,
            iv: iv.toString('hex'),
            tag: cipher.getAuthTag().toString('hex')
        };
    }

    /**
     * Decrypt memory content
     */
    static decrypt(encryptedData: string, iv: string, tag: string): string {
        const decipher = crypto.createDecipheriv(
            this.ALGORITHM,
            Buffer.from(this.KEY, 'hex'),
            Buffer.from(iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(tag, 'hex'));

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Generate SHA-256 hash for blockchain verification
     */
    static generateHash(text: string): string {
        return crypto.createHash('sha256').update(text).digest('hex');
    }

    /**
     * Generate a hex string format for Solidity bytes32
     */
    static formatForSolidity(hash: string): string {
        return hash.startsWith('0x') ? hash : `0x${hash}`;
    }
}
