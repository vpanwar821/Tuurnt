import { increaseTime, takeSnapshot, revertToSnapshot } from './helpers/time';
import { ensureException, duration, timeDifference } from './helpers/Utils';

const TUURNT = artifacts.require('TuurntToken.sol');
const CROWDSALE = artifacts.require('TuurntCrowdsale.sol');
const WHITELIST = artifacts.require('TuurntWhitelist.sol');
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
let holder5;
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
        holder5 = accounts[9];
        name = "Tuurnt Token";
        symbol = "TRT";
        decimals = 18; 
        
    });

    it('Verify constructor', async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let beneficiaryAddr = await Tuurnt.beneficiaryAddress();
        assert.equal(beneficiaryAddr,beneficiaryAddress);

    });

    it("setTokenAddress:set the token contract address", async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        let tokenAddr = await Tuurnt.tokenAddress();
        assert.equal(tokenAddr.toString(),TuurntToken.address);
    });

    it("setTokenAddress:set the token contract address by a non founder(should fail)", async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        try{
            await Tuurnt.setTokenAddress(TuurntToken.address,{from:holder1});
        }
        catch(error) {
            
            ensureException(error);
        }
    });

    it("changeMinInvestment:should change the minimum investment", async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        assert.strictEqual((await Tuurnt.MIN_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber(),.2);
        
        await Tuurnt.changeMinInvestment(new BigNumber(4).times(new BigNumber(10).pow(18)),{from:founder});

        let minValue = (await Tuurnt.MIN_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber();
        assert.strictEqual(minValue,4); 
    });

    it("changeMinInvestment:try to change the minimum investment by the non-founder(should fail)", async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        assert.strictEqual((await Tuurnt.MIN_INVESTMENT()).dividedBy(new BigNumber(10).pow(18)).toNumber(),.2);
        
        try{  
            await Tuurnt.changeMinInvestment(new BigNumber(4).times(new BigNumber(10).pow(18)),{from:holder1});
        }
        catch(error){
         
            ensureException(error);
        }
      
    });


    it("buyToken:buy tokens in privatesale,presale and crowdsale by transferring ether", async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
        timeSnapshot = await takeSnapshot();

        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        
        assert.strictEqual((await Tuurnt.getState()).toNumber(),0);

        await Whitelist.addToWhitelist(holder1,{from:founder});

        await web3.eth.sendTransaction({
            from: holder1,
            to: Tuurnt.address,
            gas: 300000,
            value: web3.toWei('1', 'ether')
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),1);
        assert.equal((await TuurntToken.balanceOf.call(holder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),17260);

        await Tuurnt.endPrivatesale({from:founder});
        
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);  //2 = Gap
        
        await Tuurnt.activePresale(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),1);  //1 = Presale

        await Whitelist.addToWhitelist(holder2,{from:founder});

        await web3.eth.sendTransaction({
            from: holder2,
            to: Tuurnt.address,
            gas: 300000,
            value: web3.toWei('1', 'ether')
        });

        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),2);
        assert.equal((await TuurntToken.balanceOf.call(holder2)).dividedBy(new BigNumber(10).pow(18)).toNumber(),14383);
        
        await increaseTime(duration.days(3));
       
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);  //2 = Gap
      
        await Tuurnt.activeCrowdsalePhase1(web3.eth.getBlock('latest').timestamp,{from:founder});
        
        assert.strictEqual((await Tuurnt.getState()).toNumber(),3);  //3 = crowdSalePhase1
        
        await Whitelist.addToWhitelist(holder3,{from:founder});

        await web3.eth.sendTransaction({
            from: holder3,
            to: Tuurnt.address,
            gas: 300000,
            value: web3.toWei('1', 'ether')
        });

        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),3);
        assert.equal((await TuurntToken.balanceOf.call(holder3)).dividedBy(new BigNumber(10).pow(18)).toNumber(),12328);
       
        await increaseTime(duration.days(8));
        
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);
        
        await Tuurnt.activeCrowdsalePhase2(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),4) //3 = crowdSalePhase2
       
        await Whitelist.addToWhitelist(holder4,{from:founder});

        await web3.eth.sendTransaction({
            from:holder4,
            to:Tuurnt.address,
            gas:300000,
            value:web3.toWei('0.5','ether')
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),3.5);
        assert.equal((await TuurntToken.balanceOf.call(holder4)).dividedBy(new BigNumber(10).pow(18)).toNumber(),5393.5);

        await increaseTime(duration.days(15));
        
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);
   
        await Tuurnt.activeCrowdsalePhase3(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),5) //4 = crowdSalePhase3
       
        await Whitelist.addToWhitelist(holder5,{from:founder});

        await web3.eth.sendTransaction({
            from:holder5,
            to:Tuurnt.address,
            gas:300000,
            value:web3.toWei('0.5','ether')
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),4);
        assert.equal((await TuurntToken.balanceOf.call(holder5)).dividedBy(new BigNumber(10).pow(18)).toNumber(),4315);
        
       
    });

    it('buyTokens:trying to buy token in the Gap time after private sale(should fail).',async()=> {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        
        await increaseTime(duration.seconds(100));
        
        await Whitelist.addToWhitelist(holder1,{from:founder});

        await web3.eth.sendTransaction({
            from: holder1,
            to: Tuurnt.address,
            gas: 300000,
            value: web3.toWei('1','ether')
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),1);
        assert.equal((await TuurntToken.balanceOf.call(holder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),17260);

        await Tuurnt.endPrivatesale({from:founder});
       
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);  //2 = Gap

        try{
            await web3.eth.sendTransaction({
               from:holder1,
               to:Tuurnt.address,
               gas:300000,
               value:web3.toWei('1','ether') 
            });
        }
        catch(error){
        
            ensureException(error);
        }

    });

    it('buyTokens:trying to buy token in the Gap time after presale(should fail).',async()=> {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        
        await increaseTime(duration.seconds(100));
        
        await Whitelist.addToWhitelist(holder1,{from:founder});

        await web3.eth.sendTransaction({
            from: holder1,
            to: Tuurnt.address,
            gas: 300000,
            value: web3.toWei('1','ether')
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),1);
        assert.equal((await TuurntToken.balanceOf.call(holder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),17260);

        await Tuurnt.endPrivatesale({from:founder});
       
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);  //2 = Gap
        
        await Tuurnt.activePresale(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),1);  //1 = Presale

        await Whitelist.addToWhitelist(holder2,{from:founder});

        await web3.eth.sendTransaction({
            from: holder2,
            to: Tuurnt.address,
            gas: 300000,
            value: web3.toWei('1', 'ether')
        });

        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),2);
        assert.equal((await TuurntToken.balanceOf.call(holder2)).dividedBy(new BigNumber(10).pow(18)).toNumber(),14383);
        
        await increaseTime(duration.days(3));
       
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);  //2 = Gap

        await Whitelist.addToWhitelist(holder3,{from:founder});

        try{
            await web3.eth.sendTransaction({
               from:holder3,
               to:Tuurnt.address,
               gas:300000,
               value:web3.toWei('1','ether') 
            });
        }
        catch(error){
           
            ensureException(error);
        }

    });

    it('buyTokens:trying to buy token without setting the token address in whitelist(should fail)',async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);    
        
        await Whitelist.addToWhitelist(holder1,{from:founder});

        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        
        await Whitelist.addToWhitelist(holder1,{from:founder});

        await web3.eth.sendTransaction({
            from: holder1,
            to: Tuurnt.address,
            gas: 300000,
            value: web3.toWei('1','ether')
        });
        
        assert.equal((await Tuurnt.ethRaised()).dividedBy(new BigNumber(10).pow(18)).toNumber(),1);
        assert.equal((await TuurntToken.balanceOf.call(holder1)).dividedBy(new BigNumber(10).pow(18)).toNumber(),17260);


        try{
            await web3.eth.sendTransaction({
                from: holder2,
                to: Tuurnt.address,
                gas: 300000,
                value: web3.toWei('1', 'ether')
            });
        }
        catch(error){
            ensureException(error);
        }
    });

    it('buyTokens:trying to buy token and the address is not in the whitlist(should fail)',async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);    
        
        await Whitelist.addToWhitelist(holder1,{from:founder});

        try{
            await web3.eth.sendTransaction({
                from: holder1,
                to: Tuurnt.address,
                gas: 300000,
                value: web3.toWei('1', 'ether')
            });
        }
        catch(error){
            
            ensureException(error);
        }
    });

    it('buyTokens:trying to buy token with ether less than the minimum investment(should fail)',async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        await Whitelist.addToWhitelist(holder1,{from:founder});
        try{
            await web3.eth.sendTransaction({
                from: holder1,
                to: Tuurnt.address,
                gas: 300000,
                value: web3.toWei('0.1', 'ether')
            });
        }
        catch(error){
           
            ensureException(error);
        }
    });


    it('buyTokens:trying to buy token after the completion of crowdsale(should fail)',async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});

        await Tuurnt.endPrivatesale({from:founder});
       
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);  //2 = Gap
        
        await Tuurnt.activePresale(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),1);  //1 = Presale

        await increaseTime(duration.days(3));
       
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);  //2 = Gap

        await Tuurnt.activeCrowdsalePhase1(web3.eth.getBlock('latest').timestamp,{from:founder});
        
        assert.strictEqual((await Tuurnt.getState()).toNumber(),3);  //3 = crowdSalePhase1

        await increaseTime(duration.days(8));

        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);
        
        await Tuurnt.activeCrowdsalePhase2(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),4) //3 = crowdSalePhase2

        await increaseTime(duration.days(15));
        
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);

        await Tuurnt.activeCrowdsalePhase3(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),5) //4 = crowdSalePhase3
        
        await increaseTime(duration.days(50));
        
        await Whitelist.addToWhitelist(holder1,{from:founder});

        try{
            await web3.eth.sendTransaction({
                from: holder1,
                to: Tuurnt.address,
                gas: 300000,
                value: web3.toWei('1', 'ether')
            });
        }
        catch(error){
            
           ensureException(error);
        }
    });

    it('endCrowdfund:Should end the crowdfund after the completion of crowdsale and transfer the remaining tokens to the company address', async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});
        
        await Tuurnt.endPrivatesale({from:founder});
       
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);  //2 = Gap
        
        await Tuurnt.activePresale(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),1);  //1 = Presale

        await increaseTime(duration.days(3));
       
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);  //2 = Gap

        await Tuurnt.activeCrowdsalePhase1(web3.eth.getBlock('latest').timestamp,{from:founder});
        
        assert.strictEqual((await Tuurnt.getState()).toNumber(),3);  //3 = crowdSalePhase1

        await increaseTime(duration.days(8));

        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);
        
        await Tuurnt.activeCrowdsalePhase2(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),4) //4 = crowdSalePhase2

        await increaseTime(duration.days(15));
        
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);

        await Tuurnt.activeCrowdsalePhase3(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),5) //5 = crowdSalePhase3

        await increaseTime(duration.days(50));
        
        await Tuurnt.endCrowdfund(companyAddress,{from:founder});
        assert.equal(await TuurntToken.balanceOf.call(Tuurnt.address),0);
        assert.equal((await TuurntToken.balanceOf.call(companyAddress)).dividedBy(new BigNumber(10).pow(18)).toNumber(),335000000);
    
    });



    it('endCrowdfund:trying to end the crowdfund by a non founder(should fail)',async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        
        await Tuurnt.setTokenAddress(TuurntToken.address,{from:founder});

        await Tuurnt.endPrivatesale({from:founder});
       
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);  //2 = Gap
        
        await Tuurnt.activePresale(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),1);  //1 = Presale

        await increaseTime(duration.days(3));
       
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);  //2 = Gap

        await Tuurnt.activeCrowdsalePhase1(web3.eth.getBlock('latest').timestamp,{from:founder});
        
        assert.strictEqual((await Tuurnt.getState()).toNumber(),3);  //3 = crowdSalePhase1

        await increaseTime(duration.days(8));

        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);
        
        await Tuurnt.activeCrowdsalePhase2(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),4) //4 = crowdSalePhase2

        await increaseTime(duration.days(15));
        
        assert.strictEqual((await Tuurnt.getState()).toNumber(),2);

        await Tuurnt.activeCrowdsalePhase3(web3.eth.getBlock('latest').timestamp,{from:founder});

        assert.strictEqual((await Tuurnt.getState()).toNumber(),5) //5 = crowdSalePhase3

        await increaseTime(duration.days(50));
        
        try{
            await Tuurnt.endCrowdfund(companyAddress,{from:holder1});
        }
        catch(error){
         
            ensureException(error);
        }
    });


    it('changeEtherRate:should change the ether rate by the founder',async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        let newEthrate = 630;
        await Tuurnt.setEtherRate(new BigNumber(newEthrate).times(new BigNumber(10).pow(18)),{from:founder});
        assert.equal((await Tuurnt.ethRate()).dividedBy(new BigNumber(10).pow(18)).toNumber(),630);
    });

    it('changeEtherRate:trying to change the ether rate by a non-founder(should fail)',async() => {
        startDate = web3.eth.getBlock('latest').timestamp;
        let Whitelist = await WHITELIST.new();
        let Tuurnt = await CROWDSALE.new(beneficiaryAddress,Whitelist.address,startDate);
        let TuurntToken = await TUURNT.new(Tuurnt.address,teamAddress,companyAddress,name,symbol,decimals);
        let newEthrate = 630;
        try{
        await Tuurnt.setEtherRate(new BigNumber(newEthrate).times(new BigNumber(10).pow(18)),{from:holder1});
        }
        catch(error){
            
            ensureException(error);
        }
    });
});
