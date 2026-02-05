import { AppDataSource } from '../config/database';
import { Companion } from '../db/entities/Companion';
import { BlockchainService } from './blockchain.service';

/**
 * NFT & Progression Service
 * Manages the growth and on-chain syncing of AI companions
 */
export class CompanionNFTService {
    private static readonly XP_PER_MESSAGE = 10;
    private static readonly XP_BASE = 100; // XP needed for Level 2

    /**
     * Add XP to companion based on interaction
     */
    static async addExperience(userAddress: string, amount: number = this.XP_PER_MESSAGE): Promise<Companion | null> {
        const repo = AppDataSource.getRepository(Companion);
        const companion = await repo.findOne({ where: { ownerAddress: userAddress.toLowerCase() } });

        if (!companion) return null;

        companion.experience += amount;
        companion.totalMessages += 1;
        companion.lastInteractionAt = new Date();

        // Level up logic: Level = floor(sqrt(XP/XP_BASE)) + 1 or similar
        // Simple linear level up for now:
        const nextLevelThreshold = companion.level * companion.level * this.XP_BASE;
        if (companion.experience >= nextLevelThreshold) {
            companion.level += 1;
            console.log(`🎊 Companion ${companion.name} leveled up to ${companion.level}!`);
        }

        await repo.save(companion);
        return companion;
    }

    /**
     * Generate Dynamic Metadata for the NFT
     * This JSON follows the OpenSea/ERC721 standard
     */
    static generateMetadata(companion: Companion) {
        return {
            name: companion.name,
            description: `A unique Virtual Companion owned by ${companion.ownerAddress}.`,
            image: companion.avatarUrl || "ipfs://placeholder",
            external_url: `https://virtualcompanion.ai/c/${companion.id}`,
            attributes: [
                { trait_type: "Level", value: companion.level },
                { trait_type: "Total Messages", value: companion.totalMessages },
                { trait_type: "Maturity", value: Math.min(100, companion.level * 5) },
                { trait_type: "Joined", value: companion.createdAt.toISOString() }
            ]
        };
    }

    /**
     * Sync Companion State to Blockchain (Dynamic NFT Update)
     */
    static async syncToBlockchain(companion: Companion): Promise<boolean> {
        if (!companion.tokenId) return false;

        const metadata = this.generateMetadata(companion);
        // In a real app, upload to IPFS here
        const dummyUri = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;

        // Update contract URI (if the contract supports manual URI updates for level-ups)
        // Logic for contract interaction would go in BlockchainService
        return true;
    }
}
