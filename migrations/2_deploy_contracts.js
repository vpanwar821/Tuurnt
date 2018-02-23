const TuurntToken = artifacts.require('TuurntToken.sol');
const VestingStrategy = artifacts.require('VestingStrategy.sol');
const teamAddress = 0x0;
const companyAddress = 0x0;
const crowdsaleAddress = 0x0;

module.exports = async(deployer) =>  {
    await deployer.deploy(VestingStrategy, teamAddress);
    await deployer.deploy(TuurntToken, crowdsaleAddress, VestingStrategy.address, companyAddress);
}