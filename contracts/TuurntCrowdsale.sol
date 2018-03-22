pragma solidity ^0.4.18;

/**
* @title TuurntCrowdsale
* @dev The Crowdsale contract holds the token for the public sale of token and 
* contains the function to buy token.  
*/

import 'zeppelin-solidity/contracts/math/Math.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import './TuurntToken.sol';


contract TuurntCrowdsale is Ownable {

    using SafeMath for uint256;

    TuurntToken public token;

    //variable declaration
    uint256 public MIN_INVESTMENT = 0.2 ether;
    uint256 public MAX_INVESTMENT = 10 ether;
    uint256 public ethRaised;
    uint256 public ethRate = 86300;
    uint256 public startCrowdsaleDate;
    uint256 public endCrowdsaleDate;
    uint256 public startPresaleDate;
    uint256 public endPresaleDate;
    uint256 public soldToken = 0;
    uint256 public amount;
    uint256 public softCap = 833 ether;
    uint256 public hardCap = 16667 ether;

    //addresses
    address public beneficiaryAddress;
    address public tokenAddress;

    event TokenBought(address indexed _investor, uint256 _token, uint256 _timestamp);
    event LogTokenSet(address _token, uint256 _timestamp);
    enum State {PreSale, CrowdSale, Finish}

    /**
    * @dev Transfer the ether to the beneficiaryAddress.
    * @param _fund The ether that is transferred to contract to buy tokens.  
    */
    function fundTransfer(uint256 _fund) internal returns(bool) {
        beneficiaryAddress.transfer(_fund);
        return true;
    }

    /**
    * @dev fallback function which accepts the ether and call the buy token function.
    */
    function () payable public {
        buyTokens(msg.sender);
    }

    /**
    * @dev TuurntCrowdsale constructor sets the original beneficiaryAddress and 
    * set the timeslot for the Pre-ICO and ICO.
    * @param _beneficiaryAddress The address to transfer the ether that is raised during crowdsale. 
    */
    function TuurntCrowdsale(address _beneficiaryAddress) public {
        require(_beneficiaryAddress != address(0));
        beneficiaryAddress = _beneficiaryAddress;
        startPresaleDate = now;
        endPresaleDate = now + 2 days;
        startCrowdsaleDate = endPresaleDate; 
        endCrowdsaleDate = startCrowdsaleDate + 6 weeks;
    }

    /**
    * @dev Allow founder to set the token contract address.
    * @param _tokenAddress The address of token contract.
    */
    function setTokenAddress(address _tokenAddress) onlyOwner public returns(bool) {
        require(tokenAddress == address(0));
        token = TuurntToken(_tokenAddress);
        tokenAddress = _tokenAddress;
        LogTokenSet(token, now);
        return true;
    }

    /**
    * @dev Allow founder to change the minimum investment of ether.
    * @param _newMinInvestment The value of new minimum ether investment. 
    */
    function changeMinInvestment(uint256 _newMinInvestment) onlyOwner public {
        MIN_INVESTMENT = _newMinInvestment;
    }

    /**
    * @dev Allow founder to change the maximum investment of ether.
    * @param _newMaxInvestment The value of new maximum ether investment. 
    */
    function changeMaxInvestment(uint256 _newMaxInvestment) onlyOwner public {
        MAX_INVESTMENT = _newMaxInvestment;
    }

    /**
    * @dev Allow founder to change the ether rate.
    * @params _newEthRate current rate of ether. 
    */
    function setEtherRate(uint256 _newEthRate) onlyOwner public {
        require(newEthRate != 0);
        ethRate = _newEthRate.mul(100);
    }

    /**
    * @dev Return the state based on the timestamp. 
    */
    function getState() view public returns(State) {

        if (now >= startPresaleDate && now <= endPresaleDate) {
            return State.PreSale;
        } 
        if (now >= startCrowdsaleDate && now <= endCrowdsaleDate) {
            return State.CrowdSale;
        } else {
            return State.Finish;
        }

    }

    /**
    * @dev Return the rate based on the state and timestamp.
    */
    function getRate() view public returns(uint256) { 
        if (getState() == State.PreSale) {
            return 6;
        }
        if (getState() == State.CrowdSale) {
            if (now >= startCrowdsaleDate + 2 weeks && now <= endCrowdsaleDate) {
                return 10;
            }
            if (now >= startCrowdsaleDate + 1 weeks) {
                return 8;
            }
            if (now >= startCrowdsaleDate) {
                return 7;
            }
            return 0;
        }
    } 

    /**
    * @dev Calculate the number of tokens to be transferred to the investor address 
    * based on the invested ethers.
    * @param _investedAmount The value of ether that is invested.  
    */
    function getTokenAmount(uint256 _investedAmount) view public returns(uint256) {
        uint256 tokenRate = getRate();
        uint256 tokenAmount;
        tokenAmount = _investedAmount.mul((ethRate.div(tokenRate)));
        return tokenAmount;
    }

    /**
    * @dev Transfer the tokens to the investor address.
    * @param _investorAddress The address of investor. 
    */
    function buyTokens(address _investorAddress) 
    public 
    payable
    returns(bool)
    {
        require(_investorAddress != address(0));
        require(tokenAddress != address(0));
        require(msg.value >= MIN_INVESTMENT && msg.value <= MAX_INVESTMENT);
        amount = getTokenAmount(msg.value);
        require(fundTransfer(msg.value));
        require(token.transfer(_investorAddress, amount));
        ethRaised = ethRaised.add(msg.value);
        soldToken = soldToken.add(amount);
        TokenBought(_investorAddress,amount,now);
        return true;
    }

    /**
    * @dev Allow founder to end the crowsale and transfer the remaining
    * tokens of crowdfund to the company address. 
    */
    function endCrowdfund(address companyAddress) onlyOwner public returns(bool) {
        require(now > endCrowdsaleDate || ethRaised >= hardCap);
        uint256 remaining = token.balanceOf(this);
        require(token.transfer(companyAddress, remaining));
    }

}