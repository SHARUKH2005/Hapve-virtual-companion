// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CompanionNFT
 * @dev NFT representing AI companion ownership
 * Each user can have one companion, proving true ownership
 */
contract CompanionNFT is ERC721, ERC721URIStorage, Ownable {

    // Events
    event CompanionMinted(address indexed owner, uint256 indexed tokenId, string companionName);
    event CompanionMetadataUpdated(uint256 indexed tokenId, string newTokenURI);
    event MemoryHashStored(uint256 indexed tokenId, bytes32 memoryHash, uint256 timestamp);
    event CompanionLevelUp(uint256 indexed tokenId, uint256 newLevel);
    event ReputationUpdated(uint256 indexed tokenId, int256 newReputation);
    event SkillUnlocked(uint256 indexed tokenId, string skillName);

    // Structs
    struct CompanionData {
        string name;              // Companion name
        uint256 createdAt;        // Creation timestamp
        uint256 lastInteraction;  // Last interaction timestamp
        bytes32[] memoryHashes;   // Array of memory integrity hashes
        uint256 level;            // Companion level
        uint256 experience;       // Cumulative XP
        int256 reputation;       // Reputation score (can be negative)
        string[] unlockedSkills;  // List of special AI capabilities
        bool isActive;            // Whether companion is active
    }

    // State variables
    uint256 private _nextTokenId;
    mapping(uint256 => CompanionData) public companions;
    mapping(address => uint256) public ownerToCompanion;
    mapping(address => bool) public authorizedOperators; // Backend addresses allowed to update XP
    
    uint256 public constant MAX_SUPPLY = 100000;
    bool public mintingEnabled = true;

    // Modifiers
    modifier onlyCompanionOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not the companion owner");
        _;
    }

    modifier onlyAuthorized() {
        require(owner() == msg.sender || authorizedOperators[msg.sender], "Not authorized");
        _;
    }

    /**
     * @dev Constructor
     */
    constructor() ERC721("Virtual Companion", "VCOMP") Ownable(msg.sender) {}

    /**
     * @dev Authorized logic to update XP and potentially Level Up
     */
    function updateProgression(uint256 tokenId, uint256 xpGain, int256 reputationChange) external onlyAuthorized {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        
        CompanionData storage companion = companions[tokenId];
        companion.experience += xpGain;
        companion.reputation += reputationChange;
        companion.lastInteraction = block.timestamp;

        // Simple level-up logic: Level = sqrt(XP / 100) + 1
        uint256 newLevel = (companion.experience / 1000) + 1; // 1000 XP per level for simplicity
        if (newLevel > companion.level) {
            companion.level = newLevel;
            emit CompanionLevelUp(tokenId, newLevel);
        }

        emit ReputationUpdated(tokenId, companion.reputation);
    }

    /**
     * @dev Unlock a specific skill for the companion
     */
    function unlockSkill(uint256 tokenId, string calldata skillName) external onlyAuthorized {
        companions[tokenId].unlockedSkills.push(skillName);
        emit SkillUnlocked(tokenId, skillName);
    }

    /**
     * @dev Set authorized operator (e.g., backend wallet)
     */
    function setAuthorizedOperator(address operator, bool authorized) external onlyOwner {
        authorizedOperators[operator] = authorized;
    }

    /**
     * @dev Mint a new AI companion NFT
     */
    function mintCompanion(string memory _companionName, string memory _tokenURI) external {
        require(mintingEnabled, "Minting is disabled");
        require(ownerToCompanion[msg.sender] == 0, "Already owns a companion");
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");

        uint256 tokenId = ++_nextTokenId;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        companions[tokenId].name = _companionName;
        companions[tokenId].createdAt = block.timestamp;
        companions[tokenId].lastInteraction = block.timestamp;
        companions[tokenId].level = 1;
        companions[tokenId].isActive = true;

        ownerToCompanion[msg.sender] = tokenId;

        emit CompanionMinted(msg.sender, tokenId, _companionName);
    }

    /**
     * @dev Store memory hash
     */
    function storeMemoryHash(uint256 tokenId, bytes32 memoryHash) external onlyCompanionOwner(tokenId) {
        companions[tokenId].memoryHashes.push(memoryHash);
        emit MemoryHashStored(tokenId, memoryHash, block.timestamp);
    }

    // ... Rest of overrides (tokenURI, supportsInterface, etc.) ...
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Get companion token ID by owner address
     */
    function getCompanionByOwner(address owner) external view returns (uint256) {
        return ownerToCompanion[owner];
    }

    /**
     * @dev Get full companion data
     */
    function getCompanionData(uint256 tokenId) external view returns (CompanionData memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        return companions[tokenId];
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) ownerToCompanion[from] = 0;
        if (to != address(0)) ownerToCompanion[to] = tokenId;
        return super._update(to, tokenId, auth);
    }
}
