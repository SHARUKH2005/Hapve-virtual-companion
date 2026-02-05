import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Blockchain Service
 * Interacts with smart contracts for identity and companion ownership
 */
export class BlockchainService {
    private static provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

    private static getSigner() {
        return new ethers.Wallet(process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', this.provider);
    }

    /**
     * Store a memory hash on-chain for verification
     */
    static async storeMemoryHashOnChain(userAddress: string, memoryHash: string): Promise<string | null> {
        try {
            // Load contract ABI and Address
            const deploymentPath = path.join(__dirname, '../../../blockchain/deployments/localhost-latest.json');
            if (!fs.existsSync(deploymentPath)) return null;

            const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
            const contractAddress = deployment.contracts.CompanionNFT.address;

            // Basic ABI for memory storage
            const abi = [
                "function getCompanionByOwner(address owner) view returns (uint256)",
                "function storeMemoryHash(uint256 tokenId, bytes32 memoryHash) external"
            ];

            const contract = new ethers.Contract(contractAddress, abi, this.getSigner());

            // 1. Find the user's companion token ID
            const tokenId = await contract.getCompanionByOwner(userAddress);

            if (tokenId === 0n) {
                console.warn(`User ${userAddress} does not own a companion NFT yet.`);
                return null;
            }

            // 2. Submit the hash
            const tx = await contract.storeMemoryHash(tokenId, memoryHash);
            await tx.wait();

            return tx.hash;
        } catch (error) {
            console.error('Blockchain error storing hash:', error);
            return null;
        }
    }
}
