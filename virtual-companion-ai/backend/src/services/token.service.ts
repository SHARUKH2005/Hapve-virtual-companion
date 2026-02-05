import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Token Service
 * Manages user balance and token-based rewards
 */
export class TokenService {
    private static provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

    private static getSigner() {
        return new ethers.Wallet(process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', this.provider);
    }

    /**
     * Award tokens to a user for engagement
     * @param userAddress Recipient wallet
     * @param amount Amount in COMP (wei)
     */
    static async awardTokens(userAddress: string, amount: string = "5000000000000000000"): Promise<string | null> {
        try {
            const deploymentPath = path.join(__dirname, '../../../blockchain/deployments/localhost-latest.json');
            if (!fs.existsSync(deploymentPath)) return null;

            const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
            const tokenAddress = deployment.contracts.CompanionToken.address;

            const abi = ["function mintReward(address to, uint256 amount) external"];
            const contract = new ethers.Contract(tokenAddress, abi, this.getSigner());

            const tx = await contract.mintReward(userAddress, ethers.parseUnits(amount, 0));
            await tx.wait();

            return tx.hash;
        } catch (error) {
            console.error('Error awarding tokens:', error);
            return null;
        }
    }

    /**
     * Get user balance
     */
    static async getBalance(userAddress: string): Promise<string> {
        try {
            const deploymentPath = path.join(__dirname, '../../../blockchain/deployments/localhost-latest.json');
            if (!fs.existsSync(deploymentPath)) return "0";

            const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
            const tokenAddress = deployment.contracts.CompanionToken.address;

            const abi = ["function balanceOf(address owner) view returns (uint256)"];
            const contract = new ethers.Contract(tokenAddress, abi, this.provider);

            const balance = await contract.balanceOf(userAddress);
            return ethers.formatEther(balance);
        } catch (error) {
            return "0";
        }
    }
}
