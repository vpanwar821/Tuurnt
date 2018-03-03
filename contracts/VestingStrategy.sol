 pragma solidity ^0.4.18;

import './lib/SafeMath.sol';
import './TuurntToken.sol';

contract VestingStrategy {

    using SafeMath for uint256;

    TuurntToken token;
    // Variable declaration
    address public founderAddress;
    address public teamAddress;
    address public tokenAddress;

    uint256 public firstSlotTimestamp;
    uint256 public secondSlotTimestamp;
    uint256 public thirdSlotTimestamp;
    uint256 public finalSlotTimestamp;
    uint256 public vestingPeriod;
    uint256 public tokenReleased = 0;
    uint256 public slotAmount = 41250000 * 10 ** 18; //25% of total team token

    bool private isTokenSet = false;

    event OwnershipTransferred(uint256 _timestamp, address _newFounderAddress);

    modifier onlyFounder(){
        require(msg.sender == founderAddress);
        _;
    }

    function VestingStrategy(address _teamAddress) public {
        teamAddress = _teamAddress;
        founderAddress = msg.sender;
        firstSlotTimestamp = now + 1 * 365 days;
        secondSlotTimestamp = firstSlotTimestamp + 1 * 365 days;
        thirdSlotTimestamp = secondSlotTimestamp + 1 * 365 days;
        finalSlotTimestamp = thirdSlotTimestamp + 1 * 365 days; 
        vestingPeriod = now + 4 * 365 days;   // 3 months for crowdsale end + 4 years of vesting
    }

    function setTokenAddress(address _tokenAddress) onlyFounder public returns (bool) {
        require(_tokenAddress != address(0));
        require(isTokenSet == false);
        token = TuurntToken(_tokenAddress);
        tokenAddress = _tokenAddress;
        isTokenSet = !isTokenSet;
        return true;
    }

    function transferOwnership(address _newFounderAddress) onlyFounder public returns(bool) {
        founderAddress = _newFounderAddress;
        OwnershipTransferred(now,_newFounderAddress);
        return true;
    }

    function releaseTokenToTeam() onlyFounder public returns(bool) {
        require(isTokenSet == true);
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