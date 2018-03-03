 pragma solidity ^0.4.18;

import './lib/SafeMath.sol';
import './TuurntToken.sol';

contract TuurntCrowdsale {

    using SafeMath for uint256;

    TuurntToken public token;
    uint256 public MIN_INVESTMENT = 0.2 ether;
    uint256 public MAX_INVESTMENT = 10 ether;
    uint256 public ethRaised;
    uint256 public ethRate = 86300;
    uint256 public startCrowdsaleDate;
    uint256 public endCrowdsaleDate;
    uint256 public startPresaleDate;
    uint256 public endPresaleDate;
    uint256 public soldToken = 0;

    bool public isTokenSet = false;

    address public founderAddress;
    address public beneficiaryAddress;
    address public tokenAddress;

    event TokenBought(address indexed _investor, uint256 _token);

    enum State {PreSale, CrowdSale, Finish}

    modifier onlyFounder() {
        require(founderAddress == msg.sender);
        _;
    } 

    function fundTransfer(uint256 _fund) internal returns(bool) {
        beneficiaryAddress.transfer(_fund);
        return true;
    }

    function () payable public {
        buyTokens(msg.sender);
    }

    function TuurntCrowdsale(address _founderAddress, address _beneficiaryAddress) {
        founderAddress = _founderAddress;
        beneficiaryAddress = _beneficiaryAddress;
        startPresaleDate = now;
        endPresaleDate = now + 2 days;
        startCrowdsaleDate = endPresaleDate; 
        endCrowdsaleDate = startCrowdsaleDate + 6 weeks;
    }

    function setTokenAddress(address _tokenAddress) public returns(bool) {
        require(isTokenSet == false);
        require(_tokenAddress != address(0));
        token = TuurntToken(_tokenAddress);
        tokenAddress = _tokenAddress;
        isTokenSet = !isTokenSet;
    }

    function changeMinInvestment(uint256 _newMinInvestement) onlyFounder public {
        MIN_INVESTMENT = _newMinInvestement;
    }

    function changeMaxInvestment(uint256 _newMaxInvestement) onlyFounder public {
        MAX_INVESTMENT = _newMaxInvestement;
    }

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

    function getRate() view public returns(uint256) { 
        if (getState() == State.PreSale) {
            return 6;
        }
        if (getState() == State.CrowdSale) {
            if (now >= startCrowdsaleDate + 3 weeks && now <= endCrowdsaleDate) {
                return 10;
            }
            if (now >= startCrowdsaleDate + 2 weeks) {
                return 8;
            }
            if (now >= startCrowdsaleDate + 1 weeks) {
                return 7;
            }
            return 0;
        }
    } 

    function getTokenAmount(uint256 _investedAmount) view public returns(uint256) {
        uint256 tokenRate = getRate();
        uint256 tokenAmount;
        tokenAmount = _investedAmount.mul((ethRate.div(tokenRate)));
        return tokenAmount;
    }

    function buyTokens(address _investorAddress) 
    public 
    payable
    returns(bool)
    {
        require(_investorAddress != address(0));
        require(isTokenSet == true);
        require(msg.value >= MIN_INVESTMENT && msg.value <= MAX_INVESTMENT);
        uint256 amount;
        amount = getTokenAmount(msg.value);
        require(fundTransfer(msg.value));
        require(token.transfer(_investorAddress,amount));
        ethRaised = ethRaised.add(msg.value);
        soldToken = soldToken.add(amount);
        TokenBought(_investorAddress,amount);
        return true;
    }

    function endCrowdfund() onlyFounder public returns(bool) {
        require(now > endCrowdsaleDate);
        require(token.transferRemainingToCompany());
    }

}