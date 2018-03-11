pragma solidity ^0.4.18;

/**
* @title VestingStrategy 
* @dev The Vesting contract holds the token for the team and provides the function 
* that release the token to token.
*/

import 'zeppelin-solidity/contracts/math/Math.sol';
import './TuurntToken.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract VestingStrategy is Ownable {

    using SafeMath for uint256;

    TuurntToken token;
    
    //address
    address public teamAddress;
    address public tokenAddress;

    //timeslot timestamp
    uint256 public firstSlotTimestamp;
    uint256 public secondSlotTimestamp;
    uint256 public thirdSlotTimestamp;
    uint256 public finalSlotTimestamp;
    uint256 public vestingPeriod;
    uint256 public tokenReleased = 0;
    uint256 public slotAmount = 41250000 * 10 ** 18; //25% of total team token

    /**
    * @dev The VestingStrategy constructor set the orginal teamAddress and set the 
    * slot timestamp
    * @param _teamAddress The address of team address
    */
    function VestingStrategy(address _teamAddress) public {
        require(_teamAddress != address(0));
        teamAddress = _teamAddress;
        firstSlotTimestamp = now + 1 * 365 days;
        secondSlotTimestamp = firstSlotTimestamp + 1 * 365 days;
        thirdSlotTimestamp = secondSlotTimestamp + 1 * 365 days;
        finalSlotTimestamp = thirdSlotTimestamp + 1 * 365 days; 
        vestingPeriod = now + 4 * 365 days;   // 3 months for crowdsale end + 4 years of vesting
    }

    /**
    * @dev Allows the founder to set the token address 
    * @param _tokenAddress The token contract address   
    */
    function setTokenAddress(address _tokenAddress) onlyOwner public returns (bool) {
        require(tokenAddress == address(0));
        token = TuurntToken(_tokenAddress);
        tokenAddress = _tokenAddress;
        return true;
    }

    /**
    * @dev Allows the founder to release token to the team at some timeslots
    */
    function releaseTokenToTeam() onlyOwner public returns(bool) {
        require(tokenAddress != address(0));
        if (now >= finalSlotTimestamp) {
            if (tokenReleased == 0) {
                require(token.transfer(teamAddress, 4*slotAmount));
                tokenReleased = tokenReleased.add(4*slotAmount);
            } else if ((tokenReleased).div(slotAmount) == 1) {
                require(token.transfer(teamAddress, 3*slotAmount));
                tokenReleased = tokenReleased.add(3*slotAmount);
            } else if ((tokenReleased).div(slotAmount) == 2) {
                require(token.transfer(teamAddress, 2*slotAmount));
                tokenReleased = tokenReleased.add(2*slotAmount);
            } else if ((tokenReleased).div(slotAmount) == 3) {
                require(token.transfer(teamAddress, slotAmount));
                tokenReleased = tokenReleased.add(slotAmount);
            } 
        }else if (now >= thirdSlotTimestamp) {
            if (tokenReleased == 0) {
                require(token.transfer(teamAddress, 3*slotAmount));
                tokenReleased = tokenReleased.add(3*slotAmount);
            } else if ((tokenReleased).div(slotAmount) == 1) {
                require(token.transfer(teamAddress, 2*slotAmount));
                tokenReleased = tokenReleased.add(2*slotAmount);
            } else if ((tokenReleased).div(slotAmount) == 2) {
                require(token.transfer(teamAddress, slotAmount));
                tokenReleased = tokenReleased.add(slotAmount);
            }                
        }else if (now >= secondSlotTimestamp) {
            if (tokenReleased == 0) {
                require(token.transfer(teamAddress, 2*slotAmount));
                tokenReleased = tokenReleased.add(2*slotAmount);
            } else {
                require(token.transfer(teamAddress, slotAmount));
                tokenReleased = tokenReleased.add(slotAmount);
            }                 
        }else if (now >= firstSlotTimestamp) {
            require(token.transfer(teamAddress, slotAmount));
            tokenReleased = tokenReleased.add(slotAmount);
        } else {
            return false;
        }
        return true;
    }

    

}