const { ethers } = require("hardhat");

async function main() {
    const address = process.env.ADDRESS || "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
    const balance = await ethers.provider.getBalance(address);
    console.log(`Address: ${address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
