const TuurntToken = artifacts.require('TuurntToken.sol');
const VestingStrategy = artifacts.require('VestingStrategy.sol');
const BigNumber =  require('bignumber.js');
const Utils = require('./helpers/Utils');


let tokenAddress;
let owner;
let crowdsaleAddress;
let vestingContractAddress;
let companyAddress;
let holder1;
let holder2;
let holder3;
let holder4;

contract('TuurntToken',(accounts)=>{
    before(async()=>{
        owner = accounts[0];
        crowdsaleAddress = accounts[1];
        vestingContractAddress = accounts[2];
        companyAddress = accounts[3];
        holder1 = accounts[4];
        holder2 = accounts[5];
        holder3 = accounts[6];
        holder4 = accounts[7];
        let token = await TuurntToken.new(crowdsaleAddress, vestingContractAddress, companyAddress,{from:owner});
        tokenAddress = token.address;
     });

     it('check parameters', async() => {
        let token = await TuurntToken.new(crowdsaleAddress, vestingContractAddress, companyAddress,{from:owner});
        let teamBalance = await token.balanceOf.call(vestingContractAddress);
        assert.strictEqual(teamBalance.dividedBy(new BigNumber(10).pow(18)).toNumber(),165000000);
        let companyBalance = await token.balanceOf.call(companyAddress);
        assert.strictEqual(companyBalance.dividedBy(new BigNumber(10).pow(18)).toNumber(),165000000);
        let crowdsaleBalance = await token.balanceOf.call(crowdsaleAddress);
        assert.strictEqual(crowdsaleBalance.dividedBy(new BigNumber(10).pow(18)).toNumber(),170000000);

     });

     it('verify the allocation variable', async() => {
        let token = await TuurntToken.new(crowdsaleAddress, vestingContractAddress, companyAddress, {from:owner});
        let _totalSupply = await token.totalSupply.call();
        assert.strictEqual(_totalSupply.dividedBy(new BigNumber(10).pow(18)).toNumber(),500000000);
        let _tokenAllocToTeam = await token.tokenAllocToTeam.call();
        assert.strictEqual(_tokenAllocToTeam.dividedBy(new BigNumber(10).pow(18)).toNumber(),165000000);
        let _tokenAllocToCrowdsale = await token.tokenAllocToCrowdsale.call();
        assert.strictEqual(_tokenAllocToCrowdsale.dividedBy(new BigNumber(10).pow(18)).toNumber(),170000000);
        let _tokenAllocToCompany = await token.tokenAllocToCompany.call();
        assert.strictEqual(_tokenAllocToCompany.dividedBy(new BigNumber(10).pow(18)).toNumber(),165000000);
        let _allocatedTokens = await token.allocatedTokens.call();
        assert.strictEqual(_allocatedTokens.dividedBy(new BigNumber(10).pow(18)).toNumber(),165000000);

     });

     it('transferRemainingToCompany:should be able to transfer remaining token to company address', async()=>{
        let token = await TuurntToken.new(crowdsaleAddress, vestingContractAddress, companyAddress, {from:owner});
        await token.transferRemainingToCompany({from:crowdsaleAddress});
        let crowdsaleBalance = await token.balanceOf.call(crowdsaleAddress);
        assert.strictEqual(crowdsaleBalance.dividedBy(new BigNumber(10).pow(18)).toNumber(),0)
        let _totalSupply = await token.totalSupply.call();
        assert.strictEqual(_totalSupply.dividedBy(new BigNumber(10).pow(18)).toNumber(),330000000);
        let companyBalance = await token.balanceOf.call(companyAddress);
        assert.strictEqual(companyBalance.dividedBy(new BigNumber(10).pow(18)).toNumber(),335000000);
     });

     it('transferRemainingToCompany:should be able to transfer remaining token to company address --fail because not called from crowdsale Address', async()=>{
        let token = await TuurntToken.new(crowdsaleAddress,vestingContractAddress,companyAddress,{from:owner});
        try{
        await token.transferRemainingToCompany({from:companyAddress});
        }
        catch(error){
        return Utils.ensureException(error);
        }
     });

     it('ether:transfer ether directly to token contract --- throws error', async() => {
        let token = await TuurntToken.new(crowdsaleAddress,vestingContractAddress,companyAddress,{from:owner});
        try{
            await web3
                .eth
                .sendTransaction({
                    from: holder1,
                    to: token.address,
                    value: web3.toWei('1','Ether')
                });
            } catch (error) {
                Utils.ensureException(error);
            }
    
    });

    it('transfer:should transfer 500 tokens to holder1 from crowdfund then holder1 transfer 300 tokens to holder2', async() =>{
        let token = await TuurntToken.new(crowdsaleAddress,vestingContractAddress,companyAddress,{from:owner});
        await token
        .transfer(holder1,
        new BigNumber(500)
        .times(
            new BigNumber(10)
            .pow(18)
        ),
        {
        from:crowdsaleAddress
        });
        let balance = await token.balanceOf.call(holder1);
        assert.strictEqual(balance.dividedBy(new BigNumber(10).pow(18)).toNumber(),500);
        await token
        .transfer(holder2,
        new BigNumber(300)
        .times(new BigNumber(10).pow(18)),
        { 
        from:holder1
        });
        let balance2 = await token.balanceOf.call(holder2);
        assert.strictEqual(balance2.dividedBy(new BigNumber(10).pow(18)).toNumber(),300);
        balance = await token.balanceOf.call(holder1);
        assert.strictEqual(balance.dividedBy(new BigNumber(10).pow(18)).toNumber(),200);
        
    });

    it('approve:holder1 should approve 1000 token to holder 2 and withdraws 400 token', async()=>{
    let token = await TuurntToken.new(crowdsaleAddress,vestingContractAddress,companyAddress,{from:owner});
        await token.transfer(holder1,
            new BigNumber(1000)
            .times(
                new BigNumber(10)
                .pow(18)
            ),
            {
                from:crowdsaleAddress
            });
        await token.approve(holder2,
            new BigNumber(1000)
            .times(
                new BigNumber(10)
                .pow(18)
            ),
            {
            from:holder1
            });
        let _allowance = await token.allowance.call(holder1,holder2);
        assert.strictEqual(_allowance.dividedBy(new BigNumber(10).pow(18)).toNumber(),1000);
        await token
            .transferFrom(holder1,
            holder3,
            new BigNumber(400)
            .times(new BigNumber(10).pow(18)),
            {
                from:holder2
            });
        let _allowance1 = await token.allowance.call(holder1,holder2);
        assert.strictEqual(_allowance1.dividedBy(new BigNumber(10).pow(18)).toNumber(),600);
        let balanceholder1 = await token.balanceOf.call(holder1);
        // console.log(balanceholder1);
        assert.strictEqual(balanceholder1.dividedBy(new BigNumber(10).pow(18)).toNumber(),600);
        let balanceholder3 = await token.balanceOf.call(holder3);
        assert.strictEqual(balanceholder3.dividedBy(new BigNumber(10).pow(18)).toNumber(),400);

    });

    it('approve:holder1 should approve 500 token to holder 2 and withdraws 600 token', async()=>{
        let token = await TuurntToken.new(crowdsaleAddress,vestingContractAddress,companyAddress,{from:owner});
            await token.transfer(holder1,
                new BigNumber(1000)
                .times(
                    new BigNumber(10)
                    .pow(18)
                ),
                {
                    from:crowdsaleAddress
                });
            await token.approve(holder2,
                new BigNumber(500)
                .times(
                    new BigNumber(10)
                    .pow(18)
                ),
                {
                from:holder1
                });
            let _allowance = await token.allowance.call(holder1,holder2);
            assert.strictEqual(_allowance.dividedBy(new BigNumber(10).pow(18)).toNumber(),500);
            try{
            await token
                .transferFrom(holder1,
                holder3,
                new BigNumber(600)
                .times(new BigNumber(10).pow(18)),
                {
                    from:holder2
                });
            }
            catch(error){
                Utils.ensureException(error);
            }
            
        });

        it('Approve max (2^256 - 1)', async() => {
            let token = await TuurntToken.new(crowdsaleAddress,vestingContractAddress,companyAddress,{from:owner});
            await token.approve(holder1, '115792089237316195423570985008687907853269984665640564039457584007913129639935', {from: holder2});
            let _allowance = await token.allowance(holder2, holder1);
            let result = _allowance.equals('1.15792089237316195423570985008687907853269984665640564039457584007913129639935e' +
                    '+77');
            assert.isTrue(result);
        });
});