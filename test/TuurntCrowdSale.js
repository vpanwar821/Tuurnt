import { increaseTime, takeSnapshot, revertToSnapshot } from './helpers/time';
import { ensureException, duration, timeDifference } from './helpers/Utils';

const TUURNT = artifacts.require('TuurntToken.sol');
const CROWDSALE = artifacts.require('TuurntCrowdsale.sol');
const BigNumber = require('bignumber.js');

let founder;
let beneficiaryAddress;
let crowdsaleAddress;
let teamAddress;
let companyAddress;
let holder1;
let holder2;
let holder3;
let holder4;
let name;
let symbol;
let decimals;
let startDate;
let timeSnapshot;

contract('TuurntCrowsale',accounts =>{ 
    before(async()=>{
        founder = accounts[0];
        holder1 = accounts[1];
        holder2 = accounts[2];
        holder3 = accounts[3];
        holder4 = accounts[4];
        beneficiaryAddress = accounts[5];
        crowdsaleAddress = accounts[6];
        teamAddress = accounts[7];
        companyAddress = accounts[8]; 
        name = "Tuurnt Token";
        symbol = "TRT";
        decimals = 18; 
        startDate = 1523750400;
        
    });

    it('Verify constructor', async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
        let beneficiaryAddr = await Tuurnt.beneficiaryAddress();
        assert.equal(beneficiaryAddr,beneficiaryAddress);

        let startPresaleDate = new BigNumber(await Tuurnt.startPresaleDate()).toNumber();
        let endPresaleDate = new BigNumber(await Tuurnt.endPresaleDate()).toNumber();
        console.log("Start",startPresaleDate);
        console.log("End",endPresaleDate);
        assert.equal(await timeDifference(endPresaleDate,startPresaleDate),172800);

    });

    it("setTokenAddress:set the token contract address", async() => {
        let TuurntToken = await TUURNT.new(crowdsaleAddress,teamAddress,companyAddress,name,symbol,decimals);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        let tokenAddr = await Tuurnt.tokenAddress();
        assert.equal(tokenAddr.toString(),TuurntToken.address);
    });

    it("setTokenAddress:set the token contract address by a non founder(should fail)", async() => {
        let TuurntToken = await TUURNT.new(crowdsaleAddress,teamAddress,companyAddress,name,symbol,decimals);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
        try{
            await Tuurnt.setTokenAddress(TuurntToken.address,{from:holder1});
        }
        catch(error) {
            ensureException(error);
        }
    });

    it("changeMinInvestment:should change the minimum investment", async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
        assert.strictEqual((await Tuurnt.MIN_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber(),.2);
        
        await Tuurnt.changeMinInvestment(new BigNumber(4).times(new BigNumber(10).pow(18)),{from:founder});

        let minValue = (await Tuurnt.MIN_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber();
        assert.strictEqual(minValue,4); 
    });

    it("changeMinInvestment:try to change the minimum investment by the non-founder(should fail)", async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
        assert.strictEqual((await Tuurnt.MIN_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber(),.2);
        
        try{  
            await Tuurnt.changeMinInvestment(new BigNumber(4).times(new BigNumber(10).pow(18)),{from:holder1});
        }
        catch(error){
            ensureException(error);
        }
      
    });

    it("changeMaxInvestment:should change the maximum investment", async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
        assert.strictEqual((await Tuurnt.MAX_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber(),10);
        
        await Tuurnt.changeMaxInvestment(new BigNumber(15).times(new BigNumber(10).pow(18)),{from:founder});

        let maxValue = (await Tuurnt.MAX_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber();
        assert.strictEqual(maxValue,15); 
    });

    it("changeMaxInvestment:try to change the maximum investment by the non-founder(should fail)", async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
        assert.strictEqual((await Tuurnt.MAX_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber(),10);
        
        try{  
            await Tuurnt.changeMaxInvestment(new BigNumber(15).times(new BigNumber(10).pow(18)),{from:holder1});
        }
        catch(error){
            ensureException(error);
        }
      
    });

    it("buyToken:buy tokens in presale and crowdsale by transferring ether", async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
        timeSnapshot = await takeSnapshot();

        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        
        await increaseTime(duration.days(6));
        
        await web3.eth.sendTransaction({
            from: holder1,
            to: Tuurnt.address,
            gas: 300000,
            value: web3.toWei('1', 'ether')
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),1);
        assert.equal((await TuurntToken.balanceOf.call(holder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),14383);

        await increaseTime(duration.days(2));
        await Tuurnt.endPresale({from:founder});
        
        assert.strictEqual((await Tuurnt.getState()).toNumber(),1);  //1 = Gap

        await Tuurnt.activeCrowdsale({from:founder});
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);   //2 = crowdSale 

        await web3.eth.sendTransaction({
            from:holder2,
            to:Tuurnt.address,
            gas:300000,
            value:web3.toWei('0.5','ether')
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),1.5);
        assert.equal((await TuurntToken.balanceOf.call(holder2)).dividedBy(new BigNumber(10).pow(18)).toNumber(),6164);

        await increaseTime(duration.days(7));
        
        await web3.eth.sendTransaction({
            from:holder3,
            to:Tuurnt.address,
            gas:300000,
            value:web3.toWei('0.5','ether')            
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),2);
        assert.equal((await TuurntToken.balanceOf.call(holder3)).dividedBy(new BigNumber(10).pow(18)).toNumber(),5393.5);

        await increaseTime(duration.days(14));
        
        await web3.eth.sendTransaction({
            from:holder4,
            to:Tuurnt.address,
            gas:300000,
            value:web3.toWei('1','ether')            
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),3);
        assert.equal((await TuurntToken.balanceOf.call(holder4)).dividedBy(new BigNumber(10).pow(18)).toNumber(),8630);
        
        await revertToSnapshot(timeSnapshot);
    });

    it('buyTokens:trying to buy token in the Gap time(should fail).',async()=> {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        
        await increaseTime(duration.days(6));

        await web3.eth.sendTransaction({
            from:holder1,
            to:Tuurnt.address,
            gas:300000,
            value:web3.toWei('1','ether')
        });
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),1);
        assert.equal((await TuurntToken.balanceOf.call(holder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),14383);

    });

    // it('buyTokens:trying to buy token without setting the token address(should fail)',async() => {
    //     let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
    //     let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);

    //     try{
    //         await web3.eth.sendTransaction({
    //             from: holder1,
    //             to: Tuurnt.address,
    //             gas: 300000,
    //             value: web3.toWei('1', 'ether')
    //         });
    //     }
    //     catch(error){
    //         ensureException(error);
    //     }
    // });

    // it('buyTokens:trying to buy token with ether less than the minimum investment(should fail)',async() => {
    //     let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
    //     let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
    //     await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
    //     try{
    //         await web3.eth.sendTransaction({
    //             from: holder1,
    //             to: Tuurnt.address,
    //             gas: 300000,
    //             value: web3.toWei('0.1', 'ether')
    //         });
    //     }
    //     catch(error){
            
    //         ensureException(error);
    //     }
    // });

    // it('buyTokens:trying to buy token when hard cap has been reached(should fail)',async()=>{
    //     let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
    //     let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
    //     await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
    //     //For testing,hardCap is set to 8 ether 
    //     try{
    //         await web3.eth.sendTransaction({
    //             from:holder1,
    //             to: Tuurnt.address,
    //             gas: 300000,
    //             value: web3.toWei('9','ether')
    //         });
    //     }
    //     catch(error){
            
    //         ensureException(error);
    //     }

    // });

    // it('buyTokens:trying to buy token with ether greater than the maximum investment(should fail)',async() => {
    //     let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
    //     let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
    //     await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        
    //     try{
    //         await web3.eth.sendTransaction({
    //             from: holder1,
    //             to: Tuurnt.address,
    //             gas: 300000,
    //             value: web3.toWei('11', 'ether')
    //         });
    //     }
    //     catch(error){
    //         ensureException(error);
    //     }
    // });

    // it('buyTokens:trying to buy token after the completion of crowdsale(should fail)',async() => {
    //     let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
    //     let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
    //     await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
    //     await increaseTime(duration.days(50));
        
    //     try{
    //         await web3.eth.sendTransaction({
    //             from: holder1,
    //             to: Tuurnt.address,
    //             gas: 300000,
    //             value: web3.toWei('1', 'ether')
    //         });
    //     }
    //     catch(error){
    //        ensureException(error);
    //     }
    // });

    // it('endCrowdfund:Should end the crowdfund after the completion of crowdsale and transfer the remaining tokens to the company address', async() => {
    //     let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
    //     let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
    //     await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        
    //     await increaseTime(duration.days(50));
        
    //     await Tuurnt.endCrowdfund(companyAddress,{from:founder});
    //     assert.equal(await TuurntToken.balanceOf.call(Tuurnt.address),0);
    //     assert.equal((await TuurntToken.balanceOf.call(companyAddress)).dividedBy(new BigNumber(10).pow(18)).toNumber(),335000000);
    
    // });

    // // it('endCrowdfund:Should end the crowdfund when hardcap has been reached and transfer the remaining tokens the company address', async() => {
    // //     let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
    // //     let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
    // //     await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
    // //     await web3.eth.sendTransaction({
    // //         from:holder2,
    // //         to:Tuurnt.address,
    // //         gas:300000,
    // //         value:web3.toWei('16668','ether')
    // //     });
       
    // //     await Tuurnt.endCrowdfund(companyAddress,{from:founder});
    // //     assert.equal((await TuurntToken.balanceOf.call(Tuurnt.address)).dividedBy(new BigNumber(10).pow(18)).toNumber(),0);
    // //     assert.equal((await TuurntToken.balanceOf.call(companyAddress)).dividedBy(new BigNumber(10).pow(18)).toNumber(),334856170);
        
    // // });

    // it('endCrowdfund:trying to end the crowdfund by a non founder(should fail)',async() => {
    //     let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
    //     let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
    //     await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
    //     await increaseTime(duration.days(50));
        
    //     try{
    //         await Tuurnt.endCrowdfund(companyAddress,{from:holder1});
    //     }
    //     catch(error){
    //         ensureException(error);
    //     }
    // });

    // it('endCrowdfund:trying to end the crowdfund before the crowdsale(should fail) and before reaching the hardcap',async() => {
    //     let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
    //     let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
    //     await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
    //     await increaseTime(duration.days(42));
        
    //     try{
    //         await Tuurnt.endCrowdfund(companyAddress,{from:founder});
    //     }
    //     catch(error){
    //         ensureException(error);
    //     }
    // });

    // // it('endCrowdfund:trying to end the crowdfund before the crowdsale but reach the hardcap',async() => {
    // //     let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
    // //     let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
    // //     await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
    // //     await time.increaseTime(7*6*24*60*60);
    // //     await web3.eth.sendTransaction({
    // //                 from:holder2,
    // //                 to:Tuurnt.address,
    // //                 gas:300000,
    // //                 value:web3.toWei('10','ether')
    // //             });
    // //     await Tuurnt.endCrowdfund(companyAddress,{from:founder});
    // //     assert.equal((await TuurntToken.balanceOf.call(Tuurnt.address)).dividedBy(new BigNumber(10).pow(18)).toNumber(),0);
    // //     assert.equal((await TuurntToken.balanceOf.call(companyAddress)).dividedBy(new BigNumber(10).pow(18)).toNumber(),334913700);
    // // });

    // it('changeEtherRate:should change the ether rate by the founder',async() => {
    //     let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
    //     let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
    //     let newEthrate = 630;
    //     await Tuurnt.setEtherRate(new BigNumber(newEthrate).times(new BigNumber(10).pow(18)),{from:founder});
    //     assert.equal((await Tuurnt.ethRate()).dividedBy(new BigNumber(10).pow(18)).toNumber(),630);
    // });

    // it('changeEtherRate:trying to change the ether rate by a non-founder(should fail)',async() => {
    //     let Tuurnt = await CROWDSALE.new(beneficiaryAddress,startDate);
    //     let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
    //     let newEthrate = 630;
    //     try{
    //     await Tuurnt.setEtherRate(new BigNumber(newEthrate).times(new BigNumber(10).pow(18)),{from:holder1});
    //     }
    //     catch(error){
    //         ensureException(error);
    //     }
    // });
});
