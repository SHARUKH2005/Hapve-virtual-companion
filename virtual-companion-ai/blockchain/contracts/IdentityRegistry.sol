// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IdentityRegistry
 * @dev Manages decentralized identities (DIDs) for users
 * Maps wallet addresses to DIDs and stores identity metadata
 */
contract IdentityRegistry is Ownable {
    // Events
    event IdentityRegistered(address indexed walletAddress, string did, uint256 timestamp);
    event IdentityUpdated(address indexed walletAddress, string newDid, uint256 timestamp);
    event IdentityRevoked(address indexed walletAddress, uint256 timestamp);

    // Structs
    struct Identity {
        string did;              // Decentralized Identifier (e.g., did:ethr:0xABC...)
        uint256 createdAt;       // Timestamp of creation
        uint256 updatedAt;       // Last update timestamp
        bool isActive;           // Whether identity is active
        bytes32 metadataHash;    // IPFS hash of additional metadata
    }

    // State variables
    mapping(address => Identity) private identities;
    mapping(string => address) private didToAddress;
    uint256 public totalIdentities;

    // Modifiers
    modifier hasIdentity() {
        require(identities[msg.sender].isActive, "Identity does not exist");
        _;
    }

    modifier noIdentity() {
        require(!identities[msg.sender].isActive, "Identity already exists");
        _;
    }

    /**
     * @dev Constructor - initializes the contract
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register a new decentralized identity
     * @param _did The DID string (e.g., did:ethr:0x...)
     * @param _metadataHash IPFS hash of metadata
     */
    function registerIdentity(string memory _did, bytes32 _metadataHash) external noIdentity {
        require(bytes(_did).length > 0, "DID cannot be empty");
        require(didToAddress[_did] == address(0), "DID already registered");

        Identity memory newIdentity = Identity({
            did: _did,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive: true,
            metadataHash: _metadataHash
        });

        identities[msg.sender] = newIdentity;
        didToAddress[_did] = msg.sender;
        totalIdentities++;

        emit IdentityRegistered(msg.sender, _did, block.timestamp);
    }

    /**
     * @dev Update existing identity metadata
     * @param _metadataHash New IPFS hash of metadata
     */
    function updateIdentityMetadata(bytes32 _metadataHash) external hasIdentity {
        identities[msg.sender].metadataHash = _metadataHash;
        identities[msg.sender].updatedAt = block.timestamp;

        emit IdentityUpdated(msg.sender, identities[msg.sender].did, block.timestamp);
    }

    /**
     * @dev Revoke (deactivate) an identity
     */
    function revokeIdentity() external hasIdentity {
        identities[msg.sender].isActive = false;
        identities[msg.sender].updatedAt = block.timestamp;

        emit IdentityRevoked(msg.sender, block.timestamp);
    }

    /**
     * @dev Get identity by wallet address
     * @param _address Wallet address
     * @return Identity struct
     */
    function getIdentity(address _address) external view returns (Identity memory) {
        return identities[_address];
    }

    /**
     * @dev Get wallet address from DID
     * @param _did The DID string
     * @return Wallet address
     */
    function getAddressFromDID(string memory _did) external view returns (address) {
        return didToAddress[_did];
    }

    /**
     * @dev Check if address has an active identity
     * @param _address Wallet address
     * @return Boolean indicating if identity exists and is active
     */
    function hasActiveIdentity(address _address) external view returns (bool) {
        return identities[_address].isActive;
    }

    /**
     * @dev Get DID for a wallet address
     * @param _address Wallet address
     * @return DID string
     */
    function getDID(address _address) external view returns (string memory) {
        require(identities[_address].isActive, "No active identity");
        return identities[_address].did;
    }
}
