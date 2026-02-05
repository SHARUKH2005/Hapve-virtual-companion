// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CompanionToken
 * @dev Utility token for the Virtual Companion AI ecosystem ($COMP)
 * Used for premium features, memory upgrades, and rewards.
 */
contract CompanionToken is ERC20, ERC20Burnable, Ownable {
    
    mapping(address => bool) public authorizedMinter;

    event MinterUpdated(address indexed minter, bool authorized);

    constructor() ERC20("Companion AI Token", "COMP") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** decimals()); // Initial supply for ecosystem
    }

    modifier onlyMinter() {
        require(owner() == msg.sender || authorizedMinter[msg.sender], "Not an authorized minter");
        _;
    }

    /**
     * @dev Authorize a contract (like EconomyManager) to mint rewards
     */
    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinter[minter] = authorized;
        emit MinterUpdated(minter, authorized);
    }

    /**
     * @dev Mint rewards for users
     */
    function mintReward(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }
}
