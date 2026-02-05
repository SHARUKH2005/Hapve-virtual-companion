// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EthicalRules
 * @dev Enforces immutable ethical rules for AI behavior
 */
contract EthicalRules is Ownable {

    enum Rule {
        NO_MEDICAL_ADVICE,
        NO_HATE_SPEECH,
        NO_ILLEGAL_ACTS,
        NO_FINANCIAL_MANIPULATION,
        NO_ROMANTIC_DEPENDENCY
    }

    mapping(Rule => bool) public ruleEnabled;

    event RuleUpdated(Rule indexed rule, bool enabled);

    constructor() Ownable(msg.sender) {
        ruleEnabled[Rule.NO_MEDICAL_ADVICE] = true;
        ruleEnabled[Rule.NO_HATE_SPEECH] = true;
        ruleEnabled[Rule.NO_ILLEGAL_ACTS] = true;
        ruleEnabled[Rule.NO_FINANCIAL_MANIPULATION] = true;
        ruleEnabled[Rule.NO_ROMANTIC_DEPENDENCY] = true;
    }

    function setRule(Rule rule, bool enabled) external onlyOwner {
        ruleEnabled[rule] = enabled;
        emit RuleUpdated(rule, enabled);
    }

    function isRuleEnabled(Rule rule) public view returns (bool) {
        return ruleEnabled[rule];
    }
}
