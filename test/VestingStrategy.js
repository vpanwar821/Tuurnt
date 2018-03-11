import { error } from 'util';
import { V4MAPPED } from 'dns';

const VESTING = artifacts.require('VestingStrategy.sol'); 
const TUURNT = artifacts.require('TuurntToken.sol');
const Utils = require('./helpers/Utils');
const time = require('./helpers/time');
const BigNumber = require('bignumber.js');


contract('VestingStrategy', (accounts) => {
    let founder;
    let crowdsaleAddress;
    let vestingContractAddress;
    let companyAddress;
    let teamAddress;
    let holder1;
    let holder2;
    let slotAmount = 41250000;
    let name;
    let symbol;
    let decimals;

    before(async() => {
        founder = accounts[0];
        holder1 = accounts[1];
        holder2 = accounts[2];
        crowdsaleAddress = accounts[3];
        vestingContractAddress = accounts[4];
        teamAddress = accounts[5];  
        companyAddress = accounts[6];    
        name = "Tuurnt Token";
        symbol = "TRT";
        decimals = 18;   
    });

    it("Verify Constructors", async() => {
        let vesting = await VESTING.new(teamAddress);

        let teamAddr = await vesting.teamAddress();
        assert.equal(teamAddr.toString(),teamAddress);

        let firstSlotTimestamp = new BigNumber(await vesting.firstSlotTimestamp()).toNumber();
        let secondSlotTimestamp = new BigNumber(await vesting.secondSlotTimestamp()).toNumber();
        assert.equal(await Utils.timeDifference(secondSlotTimestamp,firstSlotTimestamp),31536000);  //31536000 = 365 days
        
        let thirdSlotTimestamp = new BigNumber(await vesting.thirdSlotTimestamp()).toNumber();
        assert.equal(await Utils.timeDifference(thirdSlotTimestamp,secondSlotTimestamp),31536000);  //31536000 = 365 days

        let finalSlotTimestamp = new BigNumber(await vesting.finalSlotTimestamp()).toNumber();
        assert.equal(await Utils.timeDifference(finalSlotTimestamp,thirdSlotTimestamp),31536000);  //31536000 = 365 days

        let vestingPeriod = new BigNumber(await vesting.vestingPeriod()).toNumber();
        assert.equal(await Utils.timeDifference(vestingPeriod,firstSlotTimestamp),94608000)      //94608000 = 365*3 days
      
        
    }); 

    it("setTokenAddress:Should set the token contract address", async() => {
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);
        await vesting.setTokenAddress(tuurnt.address,{from:founder});
        let tokenAddr = await vesting.tokenAddress();
        assert.equal(tokenAddr.toString(),tuurnt.address);
    });

    it("setTokenAddress:trying to set token address with the non founder address", async() => {
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);
        try{
            await vesting.setTokenAddress(tuurnt.address,{from:holder1});
        }
        catch(error) {
            Utils.ensureException(error);
        }
    });

    it("setTokenAddress:trying to set the token address again by founder (should fail)", async() => {
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);
        await vesting.setTokenAddress(tuurnt.address,{from:founder});
        try{
            await vesting.setTokenAddress(tuurnt.address,{from:founder});
        }
        catch(error) {
            Utils.ensureException(error);
        }
    });

    // it("transferOwnership:Should change the founder address with the passed address", async() => {
    //     let vesting = await VESTING.new(teamAddress);
    //     let founderAddressBefore = await vesting.founderAddress();
    //     assert.equal(founderAddressBefore.toString(),founder)
    //     await vesting.transferOwnership(holder2,{from:founder});
    //     let founderAddressAfter = await vesting.founderAddress();
    //     assert.equal(founderAddressAfter,holder2);
    // });

    // it("transferOwnership:trying to change the founder address calling by non founder(should fail)", async() => {
    //     let vesting = await VESTING.new(teamAddress);
    //     let founderAddressBefore = await vesting.founderAddress();
    //     assert.equal(founderAddressBefore.toString(),founder)
    //     try {
    //         await vesting.transferOwnership(holder2,{from:holder1});
    //     }
    //     catch(error) {
    //         Utils.ensureException(error);
    //     }
    // });

    it("releaseTokenToTeam:token release to the team after each 365 days slot", async() => {
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);
        
        await vesting.setTokenAddress(tuurnt.address,{from:founder});
        await time.increaseTime(31536000);    //365 days
        await vesting.releaseTokenToTeam({from:founder});

        let firstSlotTimestamp = new BigNumber(await vesting.firstSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,firstSlotTimestamp,3);

        let balance1 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance1.dividedBy(new BigNumber(10).pow(18)).toNumber(),slotAmount);

        await time.increaseTime(31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let secondSlotTimestamp = new BigNumber(await vesting.secondSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,secondSlotTimestamp,3);

        let balance2 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance2.dividedBy(new BigNumber(10).pow(18)).toNumber(),2*slotAmount);

        await time.increaseTime(31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let thirdSlotTimestamp = new BigNumber(await vesting.thirdSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,thirdSlotTimestamp,3);

        let balance3 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance3.dividedBy(new BigNumber(10).pow(18)).toNumber(),3*slotAmount);
        
        await time.increaseTime(31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let finalSlotTimestamp = new BigNumber(await vesting.finalSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,finalSlotTimestamp,3);

        let balance4 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance4.dividedBy(new BigNumber(10).pow(18)).toNumber(),4*slotAmount);

    });

    it("releaseTokenToTeam:token release to the team in 1st,3rd and 4th slot", async() => {
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);
        
        await vesting.setTokenAddress(tuurnt.address,{from:founder});
        await time.increaseTime(31536000);    //365 days
        await vesting.releaseTokenToTeam({from:founder});

        let firstSlotTimestamp = new BigNumber(await vesting.firstSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,firstSlotTimestamp,3);

        let balance1 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance1.dividedBy(new BigNumber(10).pow(18)).toNumber(),slotAmount);

        await time.increaseTime(2*31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let thirdSlotTimestamp = new BigNumber(await vesting.thirdSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,thirdSlotTimestamp,3);

        let balance2 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance2.dividedBy(new BigNumber(10).pow(18)).toNumber(),3*slotAmount);
        
        await time.increaseTime(31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let finalSlotTimestamp = new BigNumber(await vesting.finalSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,finalSlotTimestamp,3);

        let balance4 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance4.dividedBy(new BigNumber(10).pow(18)).toNumber(),4*slotAmount);

    });

    it("releaseTokenToTeam:token release to the team in 2nd,3rd and 4th slot after 365 days", async() => {
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);
        
        await vesting.setTokenAddress(tuurnt.address,{from:founder});
        await time.increaseTime(2*31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let secondSlotTimestamp = new BigNumber(await vesting.secondSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,secondSlotTimestamp,3);

        let balance2 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance2.dividedBy(new BigNumber(10).pow(18)).toNumber(),2*slotAmount);

        await time.increaseTime(31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let thirdSlotTimestamp = new BigNumber(await vesting.thirdSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,thirdSlotTimestamp,3);

        let balance3 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance3.dividedBy(new BigNumber(10).pow(18)).toNumber(),3*slotAmount);
        
        await time.increaseTime(31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let finalSlotTimestamp = new BigNumber(await vesting.finalSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,finalSlotTimestamp,3);

        let balance4 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance4.dividedBy(new BigNumber(10).pow(18)).toNumber(),4*slotAmount);

    });

    it("releaseTokenToTeam:token release to the team in 1st,2nd and 4th slot after 365 days", async() => {
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);
        
        await vesting.setTokenAddress(tuurnt.address,{from:founder});
        await time.increaseTime(31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let firstSlotTimestamp = new BigNumber(await vesting.firstSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,firstSlotTimestamp,3);

        let balance1 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance1.dividedBy(new BigNumber(10).pow(18)).toNumber(),slotAmount);

        await time.increaseTime(31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let secondSlotTimestamp = new BigNumber(await vesting.secondSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,secondSlotTimestamp,3);

        let balance2 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance2.dividedBy(new BigNumber(10).pow(18)).toNumber(),2*slotAmount);
        
        await time.increaseTime(2*31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let finalSlotTimestamp = new BigNumber(await vesting.finalSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,finalSlotTimestamp,3);

        let balance4 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance4.dividedBy(new BigNumber(10).pow(18)).toNumber(),4*slotAmount);

    });

    it("releaseTokenToTeam:token release to the team in 1st,4th slot after 365 days", async() => {
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);
        
        await vesting.setTokenAddress(tuurnt.address,{from:founder});
        await time.increaseTime(31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let firstSlotTimestamp = new BigNumber(await vesting.firstSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,firstSlotTimestamp,3);

        let balance1 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance1.dividedBy(new BigNumber(10).pow(18)).toNumber(),slotAmount);
        
        await time.increaseTime(3*31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let finalSlotTimestamp = new BigNumber(await vesting.finalSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,finalSlotTimestamp,3);

        let balance4 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance4.dividedBy(new BigNumber(10).pow(18)).toNumber(),4*slotAmount);

    });

    it("releaseTokenToTeam:token release to the team in 2nd,4th slot after 365 days", async() => {
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);
        
        await vesting.setTokenAddress(tuurnt.address,{from:founder});
        await time.increaseTime(2*31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let secondSlotTimestamp = new BigNumber(await vesting.secondSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,secondSlotTimestamp,3);

        let balance1 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance1.dividedBy(new BigNumber(10).pow(18)).toNumber(),2*slotAmount);
        
        await time.increaseTime(2*31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let finalSlotTimestamp = new BigNumber(await vesting.finalSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,finalSlotTimestamp,3);

        let balance4 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance4.dividedBy(new BigNumber(10).pow(18)).toNumber(),4*slotAmount);

    });

    it("releaseTokenToTeam:token release to the team in 3rd,4th slot after 365 days", async() => {
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);
        
        await vesting.setTokenAddress(tuurnt.address,{from:founder});
        await time.increaseTime(3*31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let thirdSlotTimestamp = new BigNumber(await vesting.thirdSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,thirdSlotTimestamp,3);

        let balance1 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance1.dividedBy(new BigNumber(10).pow(18)).toNumber(),3*slotAmount);
        
        await time.increaseTime(31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let finalSlotTimestamp = new BigNumber(await vesting.finalSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,finalSlotTimestamp,3);

        let balance4 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance4.dividedBy(new BigNumber(10).pow(18)).toNumber(),4*slotAmount);

    });

    it("releaseTokenToTeam:token release to the team in 4th slot after 365 days", async() => {
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);
        
        await vesting.setTokenAddress(tuurnt.address,{from:founder});
        await time.increaseTime(4*31536000);
        await vesting.releaseTokenToTeam({from:founder});
        let finalSlotTimestamp = new BigNumber(await vesting.finalSlotTimestamp()).toNumber();
        assert.closeTo(web3.eth.getBlock('latest').timestamp,finalSlotTimestamp,3);

        let balance4 = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance4.dividedBy(new BigNumber(10).pow(18)).toNumber(),4*slotAmount);

    });

    it("releaseTokenToTeam:token release to the team before 365 days(should fail)", async() => {
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);

        await vesting.setTokenAddress(tuurnt.address,{from:founder});
        await vesting.releaseTokenToTeam({from:founder});

        let balance = await tuurnt.balanceOf.call(teamAddress);
        assert.strictEqual(balance.dividedBy(new BigNumber(10)).toNumber(),0);

    });

    it("releaseTokenToTeam:trying to release token by a non founder address(shoul fail)", async() => { 
        let vesting = await VESTING.new(teamAddress);
        let tuurnt = await TUURNT.new(crowdsaleAddress,vesting.address,companyAddress,name,symbol,decimals);

        await vesting.setTokenAddress(tuurnt.address,{from:founder});
        await time.increaseTime(31536000);
        try{
            await vesting.releaseTokenToTeam({from:holder1});
        }
        catch(error){
            Utils.ensureException(error);
        }
    });

});