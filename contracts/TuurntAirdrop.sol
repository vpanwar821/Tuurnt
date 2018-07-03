pragma solidity ^0.4.23;

import '../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol';
import "./TuurntToken.sol";

contract TuurntAirdrop is Ownable {

    using SafeMath for uint256;

    TuurntToken public token;

    mapping(address=>bool) public userAddress;

    uint256 public totalDropAmount;
    uint256 public dropAmount = 100 * 10 ** 18;
    
 
    /**
    * @dev Set the token contract address.
    * @param _tokenAddress token contract address
    */
    function setTokenAddress(address _tokenAddress) onlyOwner public {
        token = TuurntToken(_tokenAddress);
    }

    /**
    * @dev User can withdraw there airdrop tokens if address exist in the whitelist. 
    */
    function airdropToken() external{
        require(userAddress[msg.sender] == false);
        totalDropAmount = totalDropAmount.add(dropAmount);
        userAddress[msg.sender] = true;
        require(token.transfer(msg.sender,dropAmount));
    }

    /**
    * @dev Founder can withdraw the remaining tokens of airdrop contract.
    * @param _addr Address where the remaining tokens will go.
    */
    function withdrawToken(address _addr) onlyOwner external{
        require(_addr != address(0));
        uint256 amount = token.balanceOf(this);
        require(token.transfer(_addr,amount));
    }

}