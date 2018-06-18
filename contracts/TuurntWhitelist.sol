pragma solidity ^0.4.23;

import '../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract TuurntWhitelist is Ownable{

    mapping(address => bool) public whitelist;
    address public airdrop;
    
    function setAirdropAddress(address _airdrop) public onlyOwner{
        airdrop = _airdrop;
    }
  /**
   * @dev Adds single address to whitelist.
   * @param _beneficiary Address to be added to the whitelist
   */
    function addToWhitelist(address _beneficiary) external onlyOwner {
        whitelist[_beneficiary] = true;
    }

  /**
   * @dev Adds list of addresses to whitelist. Not overloaded due to limitations with truffle testing.
   * @param _beneficiaries Addresses to be added to the whitelist
   */
    function addManyToWhitelist(address[] _beneficiaries) external onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            whitelist[_beneficiaries[i]] = true;
        }
    }

  /**
   * @dev Removes single address from whitelist.
   * @param _beneficiary Address to be removed to the whitelist
   */
    function removeFromWhitelist(address _beneficiary) external onlyOwner {
        whitelist[_beneficiary] = false;
    }

    function checkWhitelist(address _whiteListAddress) public view returns(bool){
        if(whitelist[_whiteListAddress])
            return true;
        else
            return false;
    }

    function deleteUserFromWhitelist(address _userAddress) public returns(bool){
        require(msg.sender == airdrop);
        whitelist[_userAddress] = false;
        return true;
    }
}

