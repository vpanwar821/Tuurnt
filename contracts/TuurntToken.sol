pragma solidity ^0.4.18;

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
   

    event TransferToken(address indexed _address, uint256 _token);

    function TuurntToken(address _crowdsaleAddress, address _vestingContract, address _companyAddress) public {
        tokenAllocToTeam = (totalSupply.mul(33)).div(100);     // 33 % Allocation
        tokenAllocToCompany = (totalSupply.mul(33)).div(100);  // 33 % Allocation 
        tokenAllocToCrowdsale = (totalSupply.mul(34)).div(100);// 34 % Allocation

        // Address 
        owner = msg.sender;        
        crowdsaleAddress = _crowdsaleAddress;
        vestingContractAddress = _vestingContract;
        companyAddress = _companyAddress;
        // founderAddress = _founderAddress;


        // Allocations
        balances[crowdsaleAddress] = tokenAllocToCrowdsale;
        balances[companyAddress] = tokenAllocToCompany;
        balances[vestingContractAddress] = tokenAllocToTeam; 

        //Add transfer event
        TransferToken(crowdsaleAddress,tokenAllocToCrowdsale);
        TransferToken(companyAddress,tokenAllocToCompany);
        TransferToken(vestingContractAddress,tokenAllocToTeam);
        allocatedTokens = balances[companyAddress];
    }  

    function transferRemainingToCompany() public returns(bool) {
        require(msg.sender == crowdsaleAddress);
        remainingTokens = balances[crowdsaleAddress];
        totalSupply = totalSupply.sub(remainingTokens);
        balances[crowdsaleAddress] = 0;
        
        //Add transfer event
       balances[companyAddress] = balances[companyAddress].add(remainingTokens); 
       TransferToken(companyAddress,remainingTokens);
        return true;
    }



}