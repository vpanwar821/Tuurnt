import { ensureException } from './helpers/Utils';

const WHITELIST = artifacts.require('TuurntWhitelist.sol');
const AIRDROP = artifacts.require('TuurntAirdrop.sol');
const BigNumber = require('bignumber.js');

let founder;
let holder1;
let holder2;

contract('TuurntWhitelist',accounts => {
    before(async()=>{
        founder = accounts[0];
        holder1 = accounts[1];
        holder2 = accounts[2];
    });

    it("addToWhitelist:Add user to whitelist by founder",async()=>{
        let whitelist = await WHITELIST.new();
        await whitelist.addToWhitelist(holder1,{from:founder});
        let userAddress = await whitelist.whitelist(holder1);
        assert.equal(userAddress,true);
    });

    it("addToWhitelist:Add user to whitelist by non-founder(should fail)",async()=>{
        let whitelist = await WHITELIST.new();
        try{
            await whitelist.addToWhitelist(holder1,{from:holder2});
        }
        catch(error)
        {
            ensureException(error);
        }
    });

    it("checkWhitelist:Check address is in whitelist or not",async() => {
        let whitelist = await WHITELIST.new();
        await whitelist.addToWhitelist(holder1,{from:founder});
        let addressStatus = await whitelist.checkWhitelist(holder1);
        assert.equal(addressStatus,true);
        let addressStatus1 = await whitelist.checkWhitelist(holder2);
        assert.equal(addressStatus1,false);
    });
    
})