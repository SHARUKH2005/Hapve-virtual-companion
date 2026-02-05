import { AppDataSource } from '../config/database';
import { Identity } from '../db/entities/Identity';

/**
 * Identity Service
 * Manages user identities in the database
 */
export class IdentityService {
    private static identityRepo = AppDataSource.getRepository(Identity);

    /**
     * Create a new identity
     */
    static async createIdentity(data: {
        walletAddress: string;
        did: string;
        metadataHash?: string;
    }): Promise<Identity> {
        const identity = this.identityRepo.create({
            walletAddress: data.walletAddress.toLowerCase(),
            did: data.did,
            metadataHash: data.metadataHash,
            lastLoginAt: new Date(),
        });

        return await this.identityRepo.save(identity);
    }

    /**
     * Get identity by wallet address
     */
    static async getIdentityByAddress(address: string): Promise<Identity | null> {
        return await this.identityRepo.findOne({
            where: { walletAddress: address.toLowerCase() },
        });
    }

    /**
     * Get identity by DID
     */
    static async getIdentityByDID(did: string): Promise<Identity | null> {
        return await this.identityRepo.findOne({
            where: { did },
        });
    }

    /**
     * Update identity metadata
     */
    static async updateMetadata(
        address: string,
        metadataHash: string
    ): Promise<Identity | null> {
        const identity = await this.getIdentityByAddress(address);

        if (!identity) return null;

        identity.metadataHash = metadataHash;
        return await this.identityRepo.save(identity);
    }

    /**
     * Update last login timestamp
     */
    static async updateLastLogin(address: string): Promise<void> {
        await this.identityRepo.update(
            { walletAddress: address.toLowerCase() },
            { lastLoginAt: new Date() }
        );
    }

    /**
     * Deactivate identity
     */
    static async deactivateIdentity(address: string): Promise<void> {
        await this.identityRepo.update(
            { walletAddress: address.toLowerCase() },
            { isActive: false }
        );
    }

    /**
     * Get all active identities
     */
    static async getActiveIdentities(): Promise<Identity[]> {
        return await this.identityRepo.find({
            where: { isActive: true },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Get identity count
     */
    static async getIdentityCount(): Promise<number> {
        return await this.identityRepo.count();
    }
}
