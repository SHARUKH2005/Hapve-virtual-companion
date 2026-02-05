// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CompanionToken.sol";
import "./CompanionNFT.sol";

/**
 * @title EconomyManager
 * @dev Manages staking, premium feature unlocks, and token spending
 */
contract EconomyManager is Ownable {
    
    CompanionToken public token;
    CompanionNFT public nft;
    
    // Pricing (in tokens)
    uint256 public constant PREMIUM_CONVO_PRICE = 50 * 10**18;
    uint256 public constant MEMORY_UPGRADE_PRICE = 500 * 10**18;
    uint256 public constant SKILL_PACK_PRICE = 1000 * 10**18;
    
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        bool isActive;
    }
    
    mapping(address => Stake) public stakes;
    
    event TokensSpent(address indexed user, string feature, uint256 amount);
    event SkillPurchased(address indexed user, uint256 indexed tokenId, string skillName);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    constructor(address _token, address _nft) Ownable(msg.sender) {
        token = CompanionToken(_token);
        nft = CompanionNFT(_nft);
    }

    /**
     * @dev Spend tokens for premium conversations
     */
    function unlockPremiumConversations() external {
        token.transferFrom(msg.sender, address(this), PREMIUM_CONVO_PRICE);
        token.burn(PREMIUM_CONVO_PRICE); // Deflationary mechanism
        
        emit TokensSpent(msg.sender, "PremiumConversations", PREMIUM_CONVO_PRICE);
    }

    /**
     * @dev Spend tokens for memory upgrades
     */
    function upgradeMemory() external {
        token.transferFrom(msg.sender, address(this), MEMORY_UPGRADE_PRICE);
        token.burn(MEMORY_UPGRADE_PRICE);
        
        emit TokensSpent(msg.sender, "MemoryUpgrade", MEMORY_UPGRADE_PRICE);
    }

    /**
     * @dev Purchase a skill pack (Step 11)
     */
    function purchaseSkill(string calldata skillName) external {
        uint256 tokenId = nft.ownerToCompanion(msg.sender);
        require(tokenId != 0, "No companion owned");
        
        token.transferFrom(msg.sender, address(this), SKILL_PACK_PRICE);
        token.burn(SKILL_PACK_PRICE);
        
        // Unlock skill on the NFT via EconomyManager being an authorized operator
        nft.unlockSkill(tokenId, skillName);
        
        emit SkillPurchased(msg.sender, tokenId, skillName);
    }

    /**
     * @dev Stake tokens to unlock advanced capabilities
     * @param amount Amount to stake
     */
    function stakeTokens(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        token.transferFrom(msg.sender, address(this), amount);
        
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = block.timestamp;
        stakes[msg.sender].isActive = true;
        
        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Unstake with minimal cooling period
     */
    function unstakeTokens() external {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.isActive, "No active stake");
        require(block.timestamp > userStake.timestamp + 1 days, "Cooldown active");
        
        uint256 amount = userStake.amount;
        userStake.amount = 0;
        userStake.isActive = false;
        
        token.transfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Check if user has enough staked for advanced features
     */
    function hasStakedEnough(address user, uint256 threshold) external view returns (bool) {
        return stakes[user].amount >= threshold;
    }
}
