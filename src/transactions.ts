import BigNumber from "bignumber.js";
import { AccountBlock } from "./accountBlock";
import { ActionQueue } from "./queue";
import { AccountBlockV2 } from "./types";
import { wait } from "./utils";
import { SigningAccount } from "./wallet";

export const viteQueue = new ActionQueue<string>()

export async function sendTX(account:SigningAccount, accountBlock:AccountBlock):Promise<Partial<AccountBlockV2>>{
    const client = accountBlock.client
    const [
        quota,
        difficulty
    ] = await Promise.all([
        client.methods.contract.getQuotaByAccount(account.address),
        accountBlock.getPreviousHash()
        .then(async () => {
            let i = 0;
            let error = null
            while(i < 3){
                try{
                    return await accountBlock.getDifficulty()
                }catch(err){
                    error = err
                    if(err?.error?.code === -35005){
                        if(i !== 2)await wait(1500)
                        i++
                    }else{
                        throw err
                    }
                }
            }
            throw error
        })
    ])
    const availableQuota = new BigNumber(quota.currentQuota)
    if(availableQuota.isLessThan(difficulty.requiredQuota)){
        await accountBlock.computePoW()
    }
    await account.signAccountBlock(accountBlock)
    
    await client.methods.ledger.sendRawTransaction(accountBlock.accountBlock)

    return accountBlock.accountBlock
}