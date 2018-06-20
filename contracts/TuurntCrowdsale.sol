pragma solidity ^0.4.23;

/**
* @title TuurntCrowdsale
* @dev The Crowdsale contract holds the token for the public sale of token and 
* contains the function to buy token.  
*/

import '../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol';
import './TuurntToken.sol';
import './WhitelistInterface.sol';


contract TuurntCrowdsale is Ownable {

    using SafeMath for uint256;

    TuurntToken public token;
    WhitelistInterface public whitelist;

    //variable declaration
    uint256 public MIN_INVESTMENT = 0.2 ether;
    uint256 public ethRaised;
    uint256 public ethRate = 524;
    uint256 public startCrowdsalePhase1Date;
    uint256 public endCrowdsalePhase1Date;
    uint256 public startCrowdsalePhase2Date;
    uint256 public endCrowdsalePhase2Date;
    uint256 public startCrowdsalePhase3Date;
    uint256 public endCrowdsalePhase3Date;
    uint256 public startPresaleDate;
    uint256 public endPresaleDate;
    uint256 public startPrivatesaleDate;
    uint256 public soldToken = 0;                                                           

    //addresses
    address public beneficiaryAddress;
    address public tokenAddress;

    bool private isPrivatesaleActive = false;
    bool private isPresaleActive = false;
    bool private isPhase1CrowdsaleActive = false;
    bool private isPhase2CrowdsaleActive = false;
    bool private isPhase3CrowdsaleActive = false;
    bool private isGapActive = false;

    event TokenBought(address indexed _investor, uint256 _token, uint256 _timestamp);
    event LogTokenSet(address _token, uint256 _timestamp);

    enum State { PrivateSale, PreSale, Gap, CrowdSalePhase1, CrowdSalePhase2, CrowdSalePhase3 }

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
    constructor(address _beneficiaryAddress, address _whitelist, uint256 _startDate) public {
        require(_beneficiaryAddress != address(0));
        beneficiaryAddress = _beneficiaryAddress;
        whitelist = WhitelistInterface(_whitelist);
        startPrivatesaleDate = _startDate;
        isPrivatesaleActive = !isPrivatesaleActive;
    }

    /**
    * @dev Allow founder to end the Private sale.
    */
    function endPrivatesale() onlyOwner public {
        require(isPrivatesaleActive == true);
        isPrivatesaleActive = !isPrivatesaleActive;
    }

    /**
    * @dev Allow founder to set the token contract address.
    * @param _tokenAddress The address of token contract.
    */
    function setTokenAddress(address _tokenAddress) onlyOwner public {
        require(tokenAddress == address(0));
        token = TuurntToken(_tokenAddress);
        tokenAddress = _tokenAddress;
        emit LogTokenSet(token, now);
    }

     /**
    * @dev Allow founder to start the Presale.
    */
    function activePresale(uint256 _presaleDate) onlyOwner public {
        require(isPresaleActive == false);
        require(isPrivatesaleActive == false);
        startPresaleDate = _presaleDate;
        endPresaleDate = startPresaleDate + 2 days;
        isPresaleActive = !isPresaleActive;
    }
   
    /**
    * @dev Allow founder to start the Crowdsale phase1.
    */
    function activeCrowdsalePhase1(uint256 _phase1Date) onlyOwner public {
        require(isPresaleActive == true);
        require(_phase1Date > endPresaleDate);
        require(isPhase1CrowdsaleActive == false);
        startCrowdsalePhase1Date = _phase1Date;
        endCrowdsalePhase1Date = _phase1Date + 1 weeks;
        isPresaleActive = !isPresaleActive;
        isPhase1CrowdsaleActive = !isPhase1CrowdsaleActive;
    }

    /**
    * @dev Allow founder to start the Crowdsale phase2. 
    */

    function activeCrowdsalePhase2(uint256 _phase2Date) onlyOwner public {
        require(isPhase2CrowdsaleActive == false);
        require(_phase2Date > endCrowdsalePhase1Date);
        require(isPhase1CrowdsaleActive == true);
        startCrowdsalePhase2Date = _phase2Date;
        endCrowdsalePhase2Date = _phase2Date + 2 weeks;
        isPhase2CrowdsaleActive = !isPhase2CrowdsaleActive;
        isPhase1CrowdsaleActive = !isPhase1CrowdsaleActive;
    }

    /**
    * @dev Allow founder to start the Crowdsale phase3. 
    */
    function activeCrowdsalePhase3(uint256 _phase3Date) onlyOwner public {
        require(isPhase3CrowdsaleActive == false);
        require(_phase3Date > endCrowdsalePhase2Date);
        require(isPhase2CrowdsaleActive == true);
        startCrowdsalePhase3Date = _phase3Date;
        endCrowdsalePhase3Date = _phase3Date + 3 weeks;
        isPhase3CrowdsaleActive = !isPhase3CrowdsaleActive;
        isPhase2CrowdsaleActive = !isPhase2CrowdsaleActive;
    }
    /**
    * @dev Allow founder to change the minimum investment of ether.
    * @param _newMinInvestment The value of new minimum ether investment. 
    */
    function changeMinInvestment(uint256 _newMinInvestment) onlyOwner public {
        MIN_INVESTMENT = _newMinInvestment;
    }

     /**
    * @dev Allow founder to change the ether rate.
    * @param _newEthRate current rate of ether. 
    */
    function setEtherRate(uint256 _newEthRate) onlyOwner public {
        require(_newEthRate != 0);
        ethRate = _newEthRate;
    }

    /**
    * @dev Return the state based on the timestamp. 
    */

    function getState() view public returns(State) {
        
        if(now >= startPrivatesaleDate && isPrivatesaleActive == true) {
            return State.PrivateSale;
        }
        if (now >= startPresaleDate && now <= endPresaleDate) {
            require(isPresaleActive == true);
            return State.PreSale;
        }
        if (now >= startCrowdsalePhase1Date && now <= endCrowdsalePhase1Date) {
            require(isPhase1CrowdsaleActive == true);
            return State.CrowdSalePhase1;
        }
        if (now >= startCrowdsalePhase2Date && now <= endCrowdsalePhase2Date) {
            require(isPhase2CrowdsaleActive == true);
            return State.CrowdSalePhase2;
        }
        if (now >= startCrowdsalePhase3Date && now <= endCrowdsalePhase3Date) {
            require(isPhase3CrowdsaleActive == true);
            return State.CrowdSalePhase3;
        }
        return State.Gap;

    }
 
    /**
    * @dev Return the rate based on the state and timestamp.
    */

    function getRate() view public returns(uint256) {
        if (getState() == State.PrivateSale) {
            return 5;
        }
        if (getState() == State.PreSale) {
            return 6;
        }
        if (getState() == State.CrowdSalePhase1) {
            return 7;
        }
        if (getState() == State.CrowdSalePhase2) {
            return 8;
        }
        if (getState() == State.CrowdSalePhase3) {
            return 10;
        }
    }
    
    /**
    * @dev Calculate the number of tokens to be transferred to the investor address 
    * based on the invested ethers.
    * @param _investedAmount The value of ether that is invested.  
    */
    function getTokenAmount(uint256 _investedAmount) view public returns(uint256) {
        uint256 tokenRate = getRate();
        uint256 tokenAmount = _investedAmount.mul((ethRate.mul(100)).div(tokenRate));
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
        require(whitelist.checkWhitelist(_investorAddress));
        if ((getState() == State.PreSale) ||
            (getState() == State.CrowdSalePhase1) || 
            (getState() == State.CrowdSalePhase2) || 
            (getState() == State.CrowdSalePhase3) || 
            (getState() == State.PrivateSale)) {
            uint256 amount;
            require(_investorAddress != address(0));
            require(tokenAddress != address(0));
            require(msg.value >= MIN_INVESTMENT);
            amount = getTokenAmount(msg.value);
            require(fundTransfer(msg.value));
            require(token.transfer(_investorAddress, amount));
            ethRaised = ethRaised.add(msg.value);
            soldToken = soldToken.add(amount);
            emit TokenBought(_investorAddress,amount,now);
            return true;
        }else {
            revert();
        }
    }

    /**
    * @dev Allow founder to end the crowsale and transfer the remaining
    * tokens of crowdfund to the company address. 
    */
    function endCrowdfund(address companyAddress) onlyOwner public returns(bool) {
        require(isPhase3CrowdsaleActive == true);
        require(now >= endCrowdsalePhase3Date); 
        uint256 remaining = token.balanceOf(this);
        require(token.transfer(companyAddress, remaining));
    }

}