// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CompanionNFT.sol";

/**
 * @title CompanionGovernance
 * @dev Simple DAO governance for the Virtual Companion AI project
 * Allows NFT holders to propose and vote on basic platform parameters
 */
contract CompanionGovernance is Ownable {
    
    CompanionNFT public companionNFT;
    
    enum ProposalStatus { Pending, Active, Passed, Rejected, Executed }
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        ProposalStatus status;
        bool executed;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;
    
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant MIN_VOTES_TO_PASS = 10; // For small scale testing
    
    event ProposalCreated(uint256 indexed id, address indexed proposer, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor(address _companionNFT) Ownable(msg.sender) {
        companionNFT = CompanionNFT(_companionNFT);
    }

    /**
     * @dev Create a new proposal
     * Only NFT holders can propose
     */
    function createProposal(string memory description) external {
        uint256 tokenId = companionNFT.getCompanionByOwner(msg.sender);
        require(tokenId > 0, "Must own a companion NFT to propose");
        
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + VOTING_PERIOD,
            status: ProposalStatus.Active,
            executed: false
        });
        
        emit ProposalCreated(proposalCount, msg.sender, description);
    }

    /**
     * @dev Vote on a proposal
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime, "Voting is not active");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        uint256 tokenId = companionNFT.getCompanionByOwner(msg.sender);
        require(tokenId > 0, "Must own a companion NFT to vote");
        
        // Voting weight = Companion Level (Rewards long-term users)
        CompanionNFT.CompanionData memory data = companionNFT.getCompanionData(tokenId);
        uint256 weight = data.level;
        
        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }
        
        hasVoted[proposalId][msg.sender] = true;
        
        emit Voted(proposalId, msg.sender, support, weight);
    }

    /**
     * @dev Process proposal result
     */
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting period still active");
        require(proposal.status == ProposalStatus.Active, "Proposal already finalized");
        
        if (proposal.forVotes > proposal.againstVotes && proposal.forVotes >= MIN_VOTES_TO_PASS) {
            proposal.status = ProposalStatus.Passed;
        } else {
            proposal.status = ProposalStatus.Rejected;
        }
    }

    /**
     * @dev Execute a passed proposal (Manual trigger by owner for now, can be automated)
     */
    function executeProposal(uint256 proposalId) external onlyOwner {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Passed, "Proposal not passed");
        require(!proposal.executed, "Already executed");
        
        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;
        
        emit ProposalExecuted(proposalId);
        // Implementation logic for different types of proposals would go here
    }
}
