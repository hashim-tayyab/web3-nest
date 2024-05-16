// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract MyToken is ERC20, ERC20Burnable, AccessControl, Ownable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address initialOwner) ERC20("MyToken", "MTK") Ownable(initialOwner){
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
    }

    event Mint(address to, uint256 amount);
    event Burn(address from, uint256 amount);
    mapping (string => bytes32) whitelistedTxHash;
    bytes32 private constant STATUS_PENDING = keccak256("Pending");
    bytes32 private constant STATUS_COMPLETED = keccak256("Completed");



    function mint(address to, uint256 amount, string memory txHash) public onlyRole(MINTER_ROLE) nonReentrant {
        require(whitelistedTxHash[txHash] != bytes32(0), "Transaction Hash is not Whitelisted");
        require(whitelistedTxHash[txHash] == STATUS_PENDING, "Transaction Status already Completed");
        whitelistedTxHash[txHash] = STATUS_COMPLETED;
        _mint(to, amount*10**18);
        emit Mint(to, amount);
    }

    function burn(uint256 amount) override public {
        _burn(msg.sender, amount*10**18);
        emit Burn(msg.sender, amount);
    }

    function grandMinterRole(address to) public onlyOwner {
        _grantRole(MINTER_ROLE, to);
    }

    function addTxHashToWhitelist(string memory txHash) external onlyOwner nonReentrant{
        require(whitelistedTxHash[txHash] == bytes32(0), "Transaction hash already exists");
        whitelistedTxHash[txHash] = STATUS_PENDING;
    }
}
