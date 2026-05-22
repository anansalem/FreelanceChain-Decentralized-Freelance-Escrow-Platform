// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RepToken
 * @author Your Team Name
 * @notice ERC20 reputation token awarded to freelancers on job completion.
 *         Only the FreelanceEscrow contract can mint tokens.
 * @dev Inherits OpenZeppelin ERC20 and Ownable.
 */
contract RepToken is ERC20, Ownable {

    /// @notice Emitted when reputation tokens are minted to a freelancer
    event ReputationAwarded(address indexed freelancer, uint256 amount);

    /**
     * @notice Deploys REP token with no initial supply.
     * @param initialOwner The Escrow contract address that owns this token
     */
    constructor(address initialOwner)
        ERC20("Reputation Token", "REP")
        Ownable(initialOwner)
    {}

    /**
     * @notice Mints REP tokens to a freelancer. Only callable by owner (Escrow).
     * @param freelancer Address of the freelancer to reward
     * @param amount Number of tokens to mint (1 REP = 1e18)
     */
    function awardReputation(address freelancer, uint256 amount)
        external
        onlyOwner
    {
        _mint(freelancer, amount);
        emit ReputationAwarded(freelancer, amount);
    }
}