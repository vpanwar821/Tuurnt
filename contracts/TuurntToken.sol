pragma solidity ^0.4.18;

/**
* @title TuurntToken 
* @dev The TuurntToken contract contains the information about 
* Tuurnt token.
*/

import './helpers/StandardToken.sol';
import './lib/SafeMath.sol';

contract TuurntToken is StandardToken {

    using SafeMath for uint256;

    // token Variable declaration
    string public name = "Tuurnt Token";                                
    string public symbol = "TRT";
    uint16 public decimals = 18;
    uint256 public totalSupply = 500000000 * 10 ** 18;

    // distribution variables
    uint256 public tokenAllocToTeam;
    uint256 public tokenAllocToCrowdsale;
    uint256 public tokenAllocToCompany;
    uint256 public allocatedTokens;
    uint256 public remainingTokens;

    // addresses
    address public owner;
    address public crowdsaleAddress;
    address public vestingContractAddress;
    address public companyAddress;
   

    /**
    * @dev The TuurntToken constructor set the orginal crowdsaleAddress,vestingAddress and companyAddress and allocate the
    * tokens to them.
    * @param _crowdsaleAddress The address of crowsale contract
    * @param _vestingContract The address of vesting contract
    * @param _companyAddress The address of company address 
    */

    function TuurntToken(address _crowdsaleAddress, address _vestingContract, address _companyAddress) public {
        tokenAllocToTeam = (totalSupply.mul(33)).div(100);     // 33 % Allocation
        tokenAllocToCompany = (totalSupply.mul(33)).div(100);  // 33 % Allocation 
        tokenAllocToCrowdsale = (totalSupply.mul(34)).div(100);// 34 % Allocation

        // Address 
        owner = msg.sender;        
        crowdsaleAddress = _crowdsaleAddress;
        vestingContractAddress = _vestingContract;
        companyAddress = _companyAddress;
        


        // Allocations
        balances[crowdsaleAddress] = tokenAllocToCrowdsale;
        balances[companyAddress] = tokenAllocToCompany;
        balances[vestingContractAddress] = tokenAllocToTeam; 

        //transfer event
        Transfer(address(0),crowdsaleAddress,tokenAllocToCrowdsale);
        Transfer(address(0),companyAddress,tokenAllocToCompany);
        Transfer(address(0),vestingContractAddress,tokenAllocToTeam);
        allocatedTokens = balances[companyAddress];
    }  

    /**
    * @dev Transfer the remaining tokens of the crowdsale to the company address
    */
    function transferRemainingToCompany() public returns(bool) {
        require(msg.sender == crowdsaleAddress);
        remainingTokens = balances[crowdsaleAddress];
        totalSupply = totalSupply.sub(remainingTokens);
        balances[crowdsaleAddress] = 0;
        balances[companyAddress] = balances[companyAddress].add(remainingTokens); 
        Transfer(address(0),companyAddress,remainingTokens);
        return true;
    }



}