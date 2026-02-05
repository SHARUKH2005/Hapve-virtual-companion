const hre = require("hardhat");

async function main() {
    const nftAddress = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
    const [deployer] = await hre.ethers.getSigners();

    console.log("Checking contract at:", nftAddress);
    try {
        const code = await hre.ethers.provider.getCode(nftAddress);
        if (code === "0x") {
            console.error("❌ ERROR: No contract found at this address! Did you restart the Hardhat node?");
            const [deployer] = await hre.ethers.getSigners();
            console.log("Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
        } else {
            console.log("✅ Contract exists!");
            const CompanionNFT = await hre.ethers.getContractAt("CompanionNFT", nftAddress);
            const name = await CompanionNFT.name().catch(() => "Unknown");
            console.log("Contract Name:", name);
        }
    } catch (e) {
        console.error("❌ RPC Error:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
