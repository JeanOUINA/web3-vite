import { AccountBlock } from "./accountBlock";
import { Client, ClientFlags } from "./client";
import { nodes } from "./constants";
import { WalletMnemonics } from "./wallet";

const client = new Client(
    nodes.testnet.ViteLabs.http,
    {
        flags: new Set([
            ClientFlags.ContractResults
        ])
    }
)
const pow = new Client(
    nodes.mainnet.Thomiz.http
)
const wallet = new WalletMnemonics("mirror chest music happy extra disorder slush spirit must vague original broken round laugh animal quarter nothing floor brand aisle exotic forest zebra wheel")
const address = wallet.mainAddress

async function main() {
    console.log(address.address)
    const unreceivedBlocks = await client.methods.ledger.getUnreceivedBlocksByAddress(address.address, 0, 100)
    for(const block of unreceivedBlocks){
        console.log(`Receiving block ${block.hash}`)
        const accountBlock = AccountBlock.receive(client, {
            producer: address.address,
            sendBlockHash: block.hash
        })
        await accountBlock.getPreviousHash()
        await accountBlock.getDifficulty()
        accountBlock.client = pow
        await accountBlock.computePoW()
        accountBlock.client = client
        await address.signAccountBlock(accountBlock)
        await accountBlock.broadcast()
    }

    const accountBlock = AccountBlock.transfer(client, {
        producer: address.address,
        recipient: "vite_0000000000000000000000000000000000000004d28108e76b",
        amount: "0",
        data: "ae0167df000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000027333000000000000000000000000000000000000000000000000000000000000"
    })
    await accountBlock.getPreviousHash()
    await accountBlock.getDifficulty()
    accountBlock.client = pow
    await accountBlock.computePoW()
    accountBlock.client = client
    await address.signAccountBlock(accountBlock)
    await accountBlock.broadcast()
    console.log(accountBlock.hash.toString("hex"))
}
main()