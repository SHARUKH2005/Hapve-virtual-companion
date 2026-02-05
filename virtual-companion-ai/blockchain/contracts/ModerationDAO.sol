// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ModerationDAO
 * @dev Decentralized moderation for abusive users and behavior rules
 */
contract ModerationDAO is Ownable {
    
    mapping(address => bool) public bannedUsers;
    mapping(address => uint256) public reports;
    
    event UserReported(address indexed user, address indexed reporter);
    event UserBanned(address indexed user);
    event UserUnbanned(address indexed user);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Report an abusive user (simulated DAO reporting)
     */
    function reportUser(address user) external {
        reports[user] += 1;
        emit UserReported(user, msg.sender);
        
        // Auto-ban if reports exceed 5 (simplistic DAO logic for demo)
        if (reports[user] >= 5 && !bannedUsers[user]) {
            bannedUsers[user] = true;
            emit UserBanned(user);
        }
    }

    function banUser(address user) external onlyOwner {
        bannedUsers[user] = true;
        emit UserBanned(user);
    }

    function unbanUser(address user) external onlyOwner {
        bannedUsers[user] = false;
        emit UserUnbanned(user);
    }

    function isBanned(address user) public view returns (bool) {
        return bannedUsers[user];
    }
}
