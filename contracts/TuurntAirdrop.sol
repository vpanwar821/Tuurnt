pragma solidity ^0.4.23;

import '../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol';
import "./WhitelistInterface.sol";
import "./TuurntToken.sol";

contract TuurntAirdrop is Ownable {

    using SafeMath for uint256;

    TuurntToken public token;
    WhitelistInterface public whitelist;


    uint256 public totalDropAmount;
    uint256 public dropAmount = 100 * 10 ** 18;
    
    
    constructor(address _whitelist) public{
        whitelist = WhitelistInterface(_whitelist);
    }

    function setTokenAddress(address _tokenAddress) onlyOwner public {
        token = TuurntToken(_tokenAddress);
    }

    function airdropToken() external{
        require(whitelist.checkWhitelist(msg.sender));
        require(token.transfer(msg.sender,dropAmount));
        totalDropAmount = totalDropAmount.add(dropAmount);
        require(whitelist.deleteUserFromWhitelist(msg.sender));
    }

    function withdrawToken(address _addr) onlyOwner external{
        require(_addr != address(0));
        uint256 amount = token.balanceOf(this);
        require(token.transfer(_addr,amount));
    }

}