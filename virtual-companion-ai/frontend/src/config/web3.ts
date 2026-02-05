import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, hardhat, polygonAmoy } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const projectId = '3fcc6b70f7cf13c0ec43f4c93f338577'; // Public testing ID

export const config = getDefaultConfig({
    appName: 'Virtual Companion AI',
    projectId: projectId,
    // Removed hardhat from chains to prevent connection spam when Hardhat isn't running
    chains: [mainnet, sepolia, polygonAmoy], // hardhat removed - add back if you run: npm run blockchain:start
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
        [polygonAmoy.id]: http(),
        // [hardhat.id]: http('http://127.0.0.1:8545'), // Uncomment if running local Hardhat node
    },
    ssr: false,
});
