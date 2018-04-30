pragma solidity ^0.4.21;

/**
* @title TuurntToken 
* @dev The TuurntToken contract contains the information about 
* Tuurnt token.
*/

import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol';
import 'openzeppelin-solidity/contracts/math/Math.sol';

contract TuurntToken is StandardToken, DetailedERC20 {

    using SafeMath for uint256;

    // distribution variables
    uint256 public tokenAllocToTeam;
    uint256 public tokenAllocToCrowdsale;
    uint256 public tokenAllocToCompany;
    

    // addresses
    address public crowdsaleAddress;
    address public teamAddress;
    address public companyAddress;
   

    /**
    * @dev The TuurntToken constructor set the orginal crowdsaleAddress,teamAddress and companyAddress and allocate the
    * tokens to them.
    * @param _crowdsaleAddress The address of crowsale contract
    * @param _teamAddress The address of team
    * @param _companyAddress The address of company 
    */

    function TuurntToken(address _crowdsaleAddress, address _teamAddress, address _companyAddress, string _name, string _symbol, uint8 _decimals) public 
        DetailedERC20(_name, _symbol, _decimals)
    {
        require(_crowdsaleAddress != address(0));
        require(_teamAddress != address(0));
        require(_companyAddress != address(0));
        totalSupply_ = 500000000 * 10 ** 18;
        tokenAllocToTeam = (totalSupply_.mul(33)).div(100);     // 33 % Allocation
        tokenAllocToCompany = (totalSupply_.mul(33)).div(100);  // 33 % Allocation 
        tokenAllocToCrowdsale = (totalSupply_.mul(34)).div(100);// 34 % Allocation

        // Address      
        crowdsaleAddress = _crowdsaleAddress;
        teamAddress = _teamAddress;
        companyAddress = _companyAddress;
        


        // Allocations
        balances[crowdsaleAddress] = tokenAllocToCrowdsale;
        balances[companyAddress] = tokenAllocToCompany;
        balances[teamAddress] = tokenAllocToTeam; 

        //transfer event
        emit Transfer(address(0), crowdsaleAddress, tokenAllocToCrowdsale);
        emit Transfer(address(0), companyAddress, tokenAllocToCompany);
        emit Transfer(address(0), teamAddress, tokenAllocToTeam);
        
    }  
}