const hre = require("hardhat");

async function main() {
    const addressToFund = process.env.ADDRESS || process.argv[2];
    if (!addressToFund) {
        console.error("Please provide an address: ADDRESS=0x... npx hardhat run scripts/fund.js --network localhost");
        process.exit(1);
    }

    const [sender] = await hre.ethers.getSigners();

    console.log(`Sending 100 ETH from ${sender.address} to ${addressToFund}...`);

    const tx = await sender.sendTransaction({
        to: addressToFund,
        value: hre.ethers.parseEther("100.0"),
    });

    await tx.wait();
    console.log("✅ Success! Wallet funded.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
