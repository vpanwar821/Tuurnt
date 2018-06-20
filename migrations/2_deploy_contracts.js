const TuurntToken = artifacts.require('TuurntToken.sol');
const TuurntCrowdsale = artifacts.require('TuurntCrowdsale.sol');
const TuurntWhitelist = artifacts.require('TuurntWhitelist.sol');
const TuurntAirdrop = artifacts.require('TuurntAirdrop.sol');
const teamAddress = 0x097b7f2d8ee9034411aa21bd8fe73b99a008b9b5;
const companyAddress = 0xe8670493f51558df27f5eaaa751398bd14fef70e;
const crowdsaleAddress = 0x9b6971aa6559d637a7544916b415dc84f9177a84;
const beneficiaryAddress = 0xf67cf70e8384d9f9b4e7d4da0ac7741524e9c24b;
const name = 'Tuurnt';
const symbol = 'TRT';
const decimals = '18';
const startDate = 1523750400;

module.exports = function(deployer,network){
    if(network == 'development'){
        deployer.deploy(TuurntWhitelist).then(function(){
            deployer.deploy(TuurntAirdrop,TuurntWhitelist.address).then(function(){
                deployer.deploy(TuurntCrowdsale, beneficiaryAddress, TuurntWhitelist.address, startDate).then(function(){
                    deployer.deploy(TuurntToken, TuurntCrowdsale.address, teamAddress, companyAddress, name, symbol, decimals); 
                })
            })
        }) 
    }
}