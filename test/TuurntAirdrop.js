import { ensureException } from './helpers/Utils';

const WHITELIST = artifacts.require('TuurntWhitelist.sol');
const AIRDROP = artifacts.require('TuurntAirdrop.sol');
const TUURNT = artifacts.require('TuurntToken.sol');
const CROWDSALE = artifacts.require('TuurntCrowdsale.sol');
const BigNumber = require('bignumber.js');

let founder;
let beneficiaryAddress;
let teamAddress;
let companyAddress;
let holder1;
let holder2;
let holder3;
let holder4;
let holder5;
let name;
let symbol;
let decimals;
let startDate;

contract("TuurntAirdrop",accounts => {
    before(async()=>{
        founder=accounts[0];
        holder1=accounts[1];
        holder2=accounts[2];
        holder3 = accounts[3];
        holder4 = accounts[4];
        beneficiaryAddress = accounts[5];
        teamAddress = accounts[6];
        companyAddress = accounts[7]; 
        holder5 = accounts[8];
        name = "Tuurnt Token";
        symbol = "TRT";
        decimals = 18; 
    });

    it("setTokenAddress:only founder can set the token address",async()=>{
        startDate = web3.eth.getBlock('latest').timestamp;
        let whitelist = await WHITELIST.new();
        let airdrop = await AIRDROP.new(whitelist.address);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await airdrop.setTokenAddress(TuurntToken.address,{from:founder});
    });

    it("setTokenAddress:trying to set the token address by non-founder",async()=>{
        startDate = web3.eth.getBlock('latest').timestamp;
        let whitelist = await WHITELIST.new();
        let airdrop = await AIRDROP.new(whitelist.address);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        try{
            await airdrop.setTokenAddress(TuurntToken.address,{from:holder1});
        }
        catch(error){
            ensureException(error);
        }
    });

    it("airdropToken:airdrop token when user in the whitelist",async()=>{
        startDate = web3.eth.getBlock('latest').timestamp;
        let whitelist = await WHITELIST.new();
        let airdrop = await AIRDROP.new(whitelist.address);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await TuurntToken.transfer(airdrop.address,new BigNumber(10000).times(new BigNumber(10).pow(18)),{from:teamAddress});
        await whitelist.addToWhitelist(holder1,{from:founder});
        assert.equal(await whitelist.checkWhitelist(holder1),true);
        await whitelist.setAirdropAddress(airdrop.address,{from:founder});
        await airdrop.setTokenAddress(TuurntToken.address,{from:founder});
        await airdrop.airdropToken({from:holder1});

        assert.equal((await TuurntToken.balanceOf.call(holder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);
        assert.equal((await airdrop.totalDropAmount()).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);

        await whitelist.addToWhitelist(holder2,{from:founder});
        assert.equal(await whitelist.checkWhitelist(holder2),true);
        await airdrop.airdropToken({from:holder2});

        assert.equal((await TuurntToken.balanceOf.call(holder2)).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);
        assert.equal((await airdrop.totalDropAmount()).dividedBy(new BigNumber(10).pow(18)).toNumber(),200);

    });

    it("airdropToken:airdrop token add group of users in whitelist",async()=>{
        startDate = web3.eth.getBlock('latest').timestamp;
        let whitelist = await WHITELIST.new();
        let airdrop = await AIRDROP.new(whitelist.address);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await TuurntToken.transfer(airdrop.address,new BigNumber(10000).times(new BigNumber(10).pow(18)),{from:teamAddress});
        await whitelist.addManyToWhitelist([holder1,holder2,holder3,holder4],{from:founder});
        assert.equal(await whitelist.checkWhitelist(holder1),true);
        await whitelist.setAirdropAddress(airdrop.address,{from:founder});
        await airdrop.setTokenAddress(TuurntToken.address,{from:founder});
        await airdrop.airdropToken({from:holder1});

        assert.equal((await TuurntToken.balanceOf.call(holder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);
        assert.equal((await airdrop.totalDropAmount()).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);

        assert.equal(await whitelist.checkWhitelist(holder2),true);
        await airdrop.airdropToken({from:holder2});

        assert.equal((await TuurntToken.balanceOf.call(holder2)).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);
        assert.equal((await airdrop.totalDropAmount()).dividedBy(new BigNumber(10).pow(18)).toNumber(),200);

        assert.equal(await whitelist.checkWhitelist(holder3),true);
        await airdrop.airdropToken({from:holder3});

        assert.equal((await TuurntToken.balanceOf.call(holder3)).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);
        assert.equal((await airdrop.totalDropAmount()).dividedBy(new BigNumber(10).pow(18)).toNumber(),300);

        assert.equal(await whitelist.checkWhitelist(holder4),true);
        await airdrop.airdropToken({from:holder4});

        assert.equal((await TuurntToken.balanceOf.call(holder4)).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);
        assert.equal((await airdrop.totalDropAmount()).dividedBy(new BigNumber(10).pow(18)).toNumber(),400);



    });

    it("airdropToken:airdrop token when user not in the whitelist(should fail)",async()=>{
        startDate = web3.eth.getBlock('latest').timestamp;
        let whitelist = await WHITELIST.new();
        let airdrop = await AIRDROP.new(whitelist.address);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await TuurntToken.transfer(airdrop.address,new BigNumber(10000).times(new BigNumber(10).pow(18)),{from:teamAddress});
       
        await whitelist.setAirdropAddress(airdrop.address,{from:founder});
        await airdrop.setTokenAddress(TuurntToken.address,{from:founder});
        try{
        await airdrop.airdropToken({from:holder1});
        }
        catch(error){
            ensureException(error);
        }
    });

    it("airdropToken:airdrop token when airdrop contract address not set in whitelist contract(should fail)",async()=>{
        startDate = web3.eth.getBlock('latest').timestamp;
        let whitelist = await WHITELIST.new();
        let airdrop = await AIRDROP.new(whitelist.address);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await TuurntToken.transfer(airdrop.address,new BigNumber(10000).times(new BigNumber(10).pow(18)),{from:teamAddress});
        await whitelist.addToWhitelist(holder1,{from:founder});
        assert.equal(await whitelist.checkWhitelist(holder1),true);
        await airdrop.setTokenAddress(TuurntToken.address,{from:founder});
        try{
        await airdrop.airdropToken({from:holder1});
        }
        catch(error){
            ensureException(error);
        }
    });

    it("airdropToken:airdrop token when token contract address not set in airdrop contract(should fail)",async()=>{
        startDate = web3.eth.getBlock('latest').timestamp;
        let whitelist = await WHITELIST.new();
        let airdrop = await AIRDROP.new(whitelist.address);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await TuurntToken.transfer(airdrop.address,new BigNumber(10000).times(new BigNumber(10).pow(18)),{from:teamAddress});
        await whitelist.addToWhitelist(holder1,{from:founder});
        assert.equal(await whitelist.checkWhitelist(holder1),true);
        await whitelist.setAirdropAddress(airdrop.address,{from:founder});
        try{
        await airdrop.airdropToken({from:holder1});
        }
        catch(error){
            ensureException(error);
        }
    });

    it("airdropToken:airdrop token when user already collected its amount",async()=>{
        startDate = web3.eth.getBlock('latest').timestamp;
        let whitelist = await WHITELIST.new();
        let airdrop = await AIRDROP.new(whitelist.address);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await TuurntToken.transfer(airdrop.address,new BigNumber(10000).times(new BigNumber(10).pow(18)),{from:teamAddress});
        await whitelist.addToWhitelist(holder1,{from:founder});
        assert.equal(await whitelist.checkWhitelist(holder1),true);
        await whitelist.setAirdropAddress(airdrop.address,{from:founder});
        await airdrop.setTokenAddress(TuurntToken.address,{from:founder});
        await airdrop.airdropToken({from:holder1});

        assert.equal((await TuurntToken.balanceOf.call(holder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);
        assert.equal((await airdrop.totalDropAmount()).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);

        try{
            await airdrop.airdropToken({from:holder1});
        }
        catch(error){
            ensureException(error);
        }
    });

    it("withdrawToken:withdraw the remaining tokens from the airdrop contract",async()=>{
        startDate = web3.eth.getBlock('latest').timestamp;
        let whitelist = await WHITELIST.new();
        let airdrop = await AIRDROP.new(whitelist.address);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await TuurntToken.transfer(airdrop.address,new BigNumber(10000).times(new BigNumber(10).pow(18)),{from:teamAddress});
        await whitelist.addToWhitelist(holder1,{from:founder});
        assert.equal(await whitelist.checkWhitelist(holder1),true);
        await whitelist.setAirdropAddress(airdrop.address,{from:founder});
        await airdrop.setTokenAddress(TuurntToken.address,{from:founder});
        await airdrop.airdropToken({from:holder1});

        assert.equal((await TuurntToken.balanceOf.call(holder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);
        assert.equal((await airdrop.totalDropAmount()).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);

        await airdrop.withdrawToken(holder2,{from:founder});

        assert.equal((await TuurntToken.balanceOf.call(holder2)).dividedBy(new BigNumber(10).pow(18)).toNumber(),9900)

    })

    it("withdrawToken:withdraw the remaining tokens from the airdrop contract by a non-founder(should fail)",async()=>{
        startDate = web3.eth.getBlock('latest').timestamp;
        let whitelist = await WHITELIST.new();
        let airdrop = await AIRDROP.new(whitelist.address);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await TuurntToken.transfer(airdrop.address,new BigNumber(10000).times(new BigNumber(10).pow(18)),{from:teamAddress});
        await whitelist.addToWhitelist(holder1,{from:founder});
        assert.equal(await whitelist.checkWhitelist(holder1),true);
        await whitelist.setAirdropAddress(airdrop.address,{from:founder});
        await airdrop.setTokenAddress(TuurntToken.address,{from:founder});
        await airdrop.airdropToken({from:holder1});

        assert.equal((await TuurntToken.balanceOf.call(holder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);
        assert.equal((await airdrop.totalDropAmount()).dividedBy(new BigNumber(10).pow(18)).toNumber(),100);

        try{
            await airdrop.withdrawToken(holder2,{from:holder3});
        }
        catch(error){
            ensureException(error);
        }
    })


})