export const COMPANION_ADDRESSES: Record<number, `0x${string}`> = {
    31337: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788", // Old Hardhat
    1337: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",  // New MetaMask Localhost
    80002: "0x0000000000000000000000000000000000000000", // Polygon Amoy (Replace after deployment)
};

export const getCompanionAddress = (chainId: number | undefined): `0x${string}` => {
    return COMPANION_ADDRESSES[chainId as number] || COMPANION_ADDRESSES[31337];
};

export const COMPANION_NFT_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_companionName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_tokenURI",
                "type": "string"
            }
        ],
        "name": "mintCompanion",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "getCompanionByOwner",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "getCompanionData",
        "outputs": [
            {
                "components": [
                    { "internalType": "string", "name": "name", "type": "string" },
                    { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
                    { "internalType": "uint256", "name": "lastInteraction", "type": "uint256" },
                    { "internalType": "bytes32[]", "name": "memoryHashes", "type": "bytes32[]" },
                    { "internalType": "uint256", "name": "level", "type": "uint256" },
                    { "internalType": "uint256", "name": "experience", "type": "uint256" },
                    { "internalType": "int256", "name": "reputation", "type": "int256" },
                    { "internalType": "string[]", "name": "unlockedSkills", "type": "string[]" },
                    { "internalType": "bool", "name": "isActive", "type": "bool" }
                ],
                "internalType": "struct CompanionNFT.CompanionData",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "tokenURI",
        "outputs": [
            { "internalType": "string", "name": "", "type": "string" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;
