const TUURNT = artifacts.require('TuurntToken.sol');
const CROWDSALE = artifacts.require('TuurntCrowdsale.sol');
const BigNumber = require('bignumber.js');
const Utils = require('./helpers/Utils');
const time = require('./helpers/time');

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
        
    });

    it('Verify constructor', async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        let beneficiaryAddr = await Tuurnt.beneficiaryAddress();
        assert.equal(beneficiaryAddr,beneficiaryAddress);

        let startPresaleDate = new BigNumber(await Tuurnt.startPresaleDate()).toNumber();
        let endPresaleDate = new BigNumber(await Tuurnt.endPresaleDate()).toNumber();
        assert.equal(await Utils.timeDifference(endPresaleDate,startPresaleDate),172800);
        let startCrowdsaleDate = new BigNumber(await Tuurnt.startCrowdsaleDate()).toNumber();
        let endCrowdsaleDate = new BigNumber(await Tuurnt.endCrowdsaleDate()).toNumber();
        assert.equal(await Utils.timeDifference(endCrowdsaleDate,startCrowdsaleDate),3628800);

    });

    it("setTokenAddress:set the token contract address", async() => {
        let TuurntToken = await TUURNT.new(crowdsaleAddress,teamAddress,companyAddress,name,symbol,decimals);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        let tokenAddr = await Tuurnt.tokenAddress();
        assert.equal(tokenAddr.toString(),TuurntToken.address);
    });

    it("setTokenAddress:set the token contract address by a non founder(should fail)", async() => {
        let TuurntToken = await TUURNT.new(crowdsaleAddress,teamAddress,companyAddress,name,symbol,decimals);
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        try{
            await Tuurnt.setTokenAddress(TuurntToken.address,{from:holder1});
        }
        catch(error) {
            Utils.ensureException(error);
        }
    });

    it("changeMinInvestment:should change the minimum investment", async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        assert.strictEqual((await Tuurnt.MIN_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber(),.2);
        
        await Tuurnt.changeMinInvestment(new BigNumber(4).times(new BigNumber(10).pow(18)),{from:founder});

        let minValue = (await Tuurnt.MIN_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber();
        assert.strictEqual(minValue,4); 
    });

    it("changeMinInvestment:try to change the minimum investment by the non-founder(should fail)", async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        assert.strictEqual((await Tuurnt.MIN_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber(),.2);
        
        try{  
            await Tuurnt.changeMinInvestment(new BigNumber(4).times(new BigNumber(10).pow(18)),{from:holder1});
        }
        catch(error){
            Utils.ensureException(error);
        }
      
    });

    it("changeMaxInvestment:should change the maximum investment", async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        assert.strictEqual((await Tuurnt.MAX_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber(),10);
        
        await Tuurnt.changeMaxInvestment(new BigNumber(15).times(new BigNumber(10).pow(18)),{from:founder});

        let maxValue = (await Tuurnt.MAX_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber();
        assert.strictEqual(maxValue,15); 
    });

    it("changeMaxInvestment:try to change the maximum investment by the non-founder(should fail)", async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        assert.strictEqual((await Tuurnt.MAX_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber(),10);
        
        try{  
            await Tuurnt.changeMaxInvestment(new BigNumber(15).times(new BigNumber(10).pow(18)),{from:holder1});
        }
        catch(error){
            Utils.ensureException(error);
        }
      
    });

    it("buyToken:buy tokens in presale and crowdsale by transferring ether", async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        
        await web3.eth.sendTransaction({
            from: holder1,
            to: Tuurnt.address,
            gas: 300000,
            value: web3.toWei('1', 'ether')
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),1);
        assert.equal((await TuurntToken.balanceOf.call(holder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),14383);

        

        await time.increaseTime(2*24*60*60+50);
        
        await web3.eth.sendTransaction({
            from:holder2,
            to:Tuurnt.address,
            gas:300000,
            value:web3.toWei('0.5','ether')
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),1.5);
        assert.equal((await TuurntToken.balanceOf.call(holder2)).dividedBy(new BigNumber(10).pow(18)).toNumber(),6164);

        await time.increaseTime(7*24*60*60+100);
        
        await web3.eth.sendTransaction({
            from:holder3,
            to:Tuurnt.address,
            gas:300000,
            value:web3.toWei('0.5','ether')            
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),2);
        assert.equal((await TuurntToken.balanceOf.call(holder3)).dividedBy(new BigNumber(10).pow(18)).toNumber(),5393.5);

        await time.increaseTime(2*7*24*60*60+100);
        
        await web3.eth.sendTransaction({
            from:holder4,
            to:Tuurnt.address,
            gas:300000,
            value:web3.toWei('1','ether')            
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),3);
        assert.equal((await TuurntToken.balanceOf.call(holder4)).dividedBy(new BigNumber(10).pow(18)).toNumber(),8630);


    });

    it('buyTokens:trying to buy token without setting the token address(should fail)',async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);

        try{
            await web3.eth.sendTransaction({
                from: holder1,
                to: Tuurnt.address,
                gas: 300000,
                value: web3.toWei('1', 'ether')
            });
        }
        catch(error){
            Utils.ensureException(error);
        }
    });

    it('buyTokens:trying to buy token with ether less than the minimum investment(should fail)',async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        try{
            await web3.eth.sendTransaction({
                from: holder1,
                to: Tuurnt.address,
                gas: 300000,
                value: web3.toWei('0.1', 'ether')
            });
        }
        catch(error){
            
            Utils.ensureException(error);
        }
    });

    it('buyTokens:trying to buy token with ether greater than the maximum investment(should fail)',async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        try{
            await web3.eth.sendTransaction({
                from: holder1,
                to: Tuurnt.address,
                gas: 300000,
                value: web3.toWei('11', 'ether')
            });
        }
        catch(error){
            
            Utils.ensureException(error);
        }
    });

    it('buyTokens:trying to buy token after the completion of crowsale(should fail)',async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        await time.increaseTime(7*7*24*60*60);
        try{
            await web3.eth.sendTransaction({
                from: holder1,
                to: Tuurnt.address,
                gas: 300000,
                value: web3.toWei('1', 'ether')
            });
        }
        catch(error){
            Utils.ensureException(error);
        }
    });

    it('endCrowdfund:Should end the crowdfund and transfer the remaining tokens to the company address', async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        await time.increaseTime(7*7*24*60*60);
        await Tuurnt.endCrowdfund(companyAddress,{from:founder});
        assert.equal(await TuurntToken.balanceOf.call(Tuurnt.address),0);
        assert.equal((await TuurntToken.balanceOf.call(companyAddress)).dividedBy(new BigNumber(10).pow(18)),335000000);
    
    });

    it('endCrowdfund:trying to end the crowdfund by a non founder(should fail)',async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        await time.increaseTime(7*7*24*60*60);
        try{
            await Tuurnt.endCrowdfund(companyAddress,{from:holder1});
        }
        catch(error){
            Utils.ensureException(error);
        }
    });

    it('endCrowdfund:trying to end the crowdfund before the crowdsale(should fail)',async() => {
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        await time.increaseTime(7*6*24*60*60);
        try{
            await Tuurnt.endCrowdfund(companyAddress,{from:founder});
        }
        catch(error){
            Utils.ensureException(error);
        }
    });

    
});
