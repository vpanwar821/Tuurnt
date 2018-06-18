pragma solidity ^0.4.23;

contract WhitelistInterface {
    function checkWhitelist(address _whiteListAddress) public view returns(bool);
    function deleteUserFromWhitelist(address _userAddress) public returns(bool);
}