const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting deployment...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 Deploying contracts with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Deploy IdentityRegistry
    console.log("📝 Deploying IdentityRegistry...");
    const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
    const identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();
    const identityRegistryAddress = await identityRegistry.getAddress();
    console.log("✅ IdentityRegistry deployed to:", identityRegistryAddress);

    // Deploy CompanionNFT
    console.log("\n📝 Deploying CompanionNFT...");
    const CompanionNFT = await hre.ethers.getContractFactory("CompanionNFT");
    const companionNFT = await CompanionNFT.deploy();
    await companionNFT.waitForDeployment();
    const companionNFTAddress = await companionNFT.getAddress();
    console.log("✅ CompanionNFT deployed to:", companionNFTAddress);

    // Deploy CompanionGovernance
    console.log("\n📝 Deploying CompanionGovernance...");
    const CompanionGovernance = await hre.ethers.getContractFactory("CompanionGovernance");
    const companionGovernance = await CompanionGovernance.deploy(companionNFTAddress);
    await companionGovernance.waitForDeployment();
    const companionGovernanceAddress = await companionGovernance.getAddress();
    console.log("✅ CompanionGovernance deployed to:", companionGovernanceAddress);

    // Deploy CompanionToken
    console.log("\n📝 Deploying CompanionToken...");
    const CompanionToken = await hre.ethers.getContractFactory("CompanionToken");
    const companionToken = await CompanionToken.deploy();
    await companionToken.waitForDeployment();
    const companionTokenAddress = await companionToken.getAddress();
    console.log("✅ CompanionToken deployed to:", companionTokenAddress);

    // Deploy EconomyManager
    console.log("\n📝 Deploying EconomyManager...");
    const EconomyManager = await hre.ethers.getContractFactory("EconomyManager");
    const economyManager = await EconomyManager.deploy(companionTokenAddress, companionNFTAddress);
    await economyManager.waitForDeployment();
    const economyManagerAddress = await economyManager.getAddress();
    console.log("✅ EconomyManager deployed to:", economyManagerAddress);

    // Set EconomyManager as authorized minter for tokens
    await companionToken.setAuthorizedMinter(economyManagerAddress, true);
    console.log("🔓 EconomyManager authorized to mint COMP rewards");

    // Set EconomyManager as authorized operator for NFT skills (Step 11)
    await companionNFT.setAuthorizedOperator(economyManagerAddress, true);
    console.log("🔓 EconomyManager authorized to unlock NFT skills");

    // Deploy Ethical Rules (Step 14)
    console.log("\n📝 Deploying EthicalRules...");
    const EthicalRules = await hre.ethers.getContractFactory("EthicalRules");
    const ethicalRules = await EthicalRules.deploy();
    await ethicalRules.waitForDeployment();
    const ethicalRulesAddress = await ethicalRules.getAddress();
    console.log("✅ EthicalRules deployed to:", ethicalRulesAddress);

    // Deploy Moderation DAO (Step 14)
    console.log("\n📝 Deploying ModerationDAO...");
    const ModerationDAO = await hre.ethers.getContractFactory("ModerationDAO");
    const moderationDAO = await ModerationDAO.deploy();
    await moderationDAO.waitForDeployment();
    const moderationDAOAddress = await moderationDAO.getAddress();
    console.log("✅ ModerationDAO deployed to:", moderationDAOAddress);

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            IdentityRegistry: {
                address: identityRegistryAddress,
                constructorArgs: []
            },
            CompanionNFT: {
                address: companionNFTAddress,
                constructorArgs: []
            },
            CompanionGovernance: {
                address: companionGovernanceAddress,
                constructorArgs: [companionNFTAddress]
            },
            CompanionToken: {
                address: companionTokenAddress,
                constructorArgs: []
            },
            EconomyManager: {
                address: economyManagerAddress,
                constructorArgs: [companionTokenAddress, companionNFTAddress]
            },
            EthicalRules: {
                address: ethicalRulesAddress,
                constructorArgs: []
            },
            ModerationDAO: {
                address: moderationDAOAddress,
                constructorArgs: []
            }
        }
    };

    // Save to file
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `${hre.network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

    // Also save as latest
    const latestPath = path.join(deploymentsDir, `${hre.network.name}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n📄 Deployment info saved to:", filepath);
    console.log("📄 Latest deployment:", latestPath);

    // Display summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", deploymentInfo.chainId);
    console.log("\nContracts:");
    console.log("  IdentityRegistry:", identityRegistryAddress);
    console.log("  CompanionNFT:    ", companionNFTAddress);
    console.log("=".repeat(60));
    console.log("\n✨ Deployment complete!\n");

    // Verification instructions
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
        console.log("📋 To verify contracts on Etherscan, run:");
        console.log(`npx hardhat verify --network ${hre.network.name} ${identityRegistryAddress}`);
        console.log(`npx hardhat verify --network ${hre.network.name} ${companionNFTAddress}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
