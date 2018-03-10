pragma solidity ^0.4.18;

/**
* @title TuurntCrowdsale
* @dev The Crowdsale contract holds the token for the public sale of token and 
* contains the function to buy token.  
*/

import './lib/SafeMath.sol';
import './TuurntToken.sol';

contract TuurntCrowdsale {

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

    bool public isTokenSet = false;

    //addresses
    address public founderAddress;
    address public beneficiaryAddress;
    address public tokenAddress;

    event TokenBought(address indexed _investor, uint256 _token);
    event LogTokenSet(address _token, uint256 _timestamp);
    enum State {PreSale, CrowdSale, Finish}

    /**
    * @dev Throws if called by an account other than founder.
    */
    modifier onlyFounder() {
        require(founderAddress == msg.sender);
        _;
    } 

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
    * @dev TuurntCrowdsale constructor sets the original founderAddress and beneficiaryAddress and 
    * set the timeslot for the Pre-ICO and ICO.
    * @param _founderAddress The address to set the founder address.
    * @param _beneficiaryAddress The address to transfer the ether that is raised during crowdsale. 
    */
    function TuurntCrowdsale(address _founderAddress, address _beneficiaryAddress) public {
        founderAddress = _founderAddress;
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
    function setTokenAddress(address _tokenAddress) onlyFounder public returns(bool) {
        require(isTokenSet == false);
        require(_tokenAddress != address(0));
        token = TuurntToken(_tokenAddress);
        tokenAddress = _tokenAddress;
        isTokenSet = !isTokenSet;
        LogTokenSet(token, now);
        return true;
    }

    /**
    * @dev Allow founder to change the minimum investment of ether.
    * @param _newMinInvestment The value of new minimum ether investment. 
    */
    function changeMinInvestment(uint256 _newMinInvestment) onlyFounder public {
        MIN_INVESTMENT = _newMinInvestment;
    }

    /**
    * @dev Allow founder to change the maximum investment of ether.
    * @param _newMaxInvestment The value of new maximum ether investment. 
    */
    function changeMaxInvestment(uint256 _newMaxInvestment) onlyFounder public {
        MAX_INVESTMENT = _newMaxInvestment;
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
        require(isTokenSet == true);
        require(msg.value >= MIN_INVESTMENT && msg.value <= MAX_INVESTMENT);
        amount = getTokenAmount(msg.value);
        require(fundTransfer(msg.value));
        require(token.transfer(_investorAddress, amount));
        ethRaised = ethRaised.add(msg.value);
        soldToken = soldToken.add(amount);
        TokenBought(_investorAddress,amount);
        return true;
    }

    /**
    * @dev Allow founder to end the crowsale and transfer the remaining
    * tokens of crowdfund to the company address. 
    */
    function endCrowdfund() onlyFounder public returns(bool) {
        require(now > endCrowdsaleDate);
        uint256 remaining = token.balanceOf(this);
        require(token.transfer(companyAddress, remaining));
    }

}