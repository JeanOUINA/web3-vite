import { Client, ClientFlags, SubscriptionResultTypes } from "./client"
import { EventEmitter } from "./events"
import { sendTX, viteQueue } from "./transactions"
import { AccountBlockV2, VmLog } from "./types"
import { NumberLike, wait, _Buffer as Buffer } from "./utils"
import { Address, SigningAccount } from "./wallet"
import * as vitejsAbi from "@vite/vitejs-abi"
import { viteTokenId } from "./constants"
import { AccountBlock } from "./accountBlock"

export class Contract {
    address: string
    abi: ABI
    offchain: string
    client: Client
    constructor(client: Client, address: string, abi: ABI, offchain?: string){
        this.abi = abi
        this.address = address
        this.client = client
        if(offchain){
            if(/^[abcdef\d]+$/.test(offchain)){
                offchain = Buffer.from(offchain, "hex").toString("base64")
            }
            this.offchain = offchain
        }
    }

    async get<T = any>(getterName: string, inputs?: string[], snapshotHash?: string, accountHeight?: string):Promise<GetterReturnType<T>>{
        if(!inputs)inputs = []
        const abi = this.abi.find(e => (e.type === "function" || e.type === "offchain") && e.name === getterName) as ABIGetter|ABIFunction
        if(!abi)throw new Error(`Function/Getter not found: ${JSON.stringify(getterName)}.`)

        const data = vitejsAbi.encodeFunctionCall(abi, inputs)
        if(this.offchain){
            const result = await this.client.methods.contract.callOffChainMethod(
                this.address,
                this.offchain,
                data,
                snapshotHash,
                accountHeight
            )
            if(!result)throw new Error(`The offchain call returned ${JSON.stringify(result)} !`)
            let decoded:any = {}
            if("decodeFunctionOutput" in vitejsAbi){
                decoded = vitejsAbi.decodeFunctionOutput(abi, result)
            }else{
                if(abi.outputs.find(e => e.type == "tuple"))throw new Error(`Cannot decode tuple: vite.js version is too old ! Please force upgrade to at least 2.3.19.`)
                decoded = vitejsAbi.decodeParameters(abi.outputs.map(e => e.type), result) as any
            }
            const object = {}
            for(let i = 0; i < abi.outputs.length; i++){
                const output = abi.outputs[i]
                if(!output.name)continue
                object[output.name] = decoded[i]
            }
            return {
                map: object as any,
                raw: decoded
            }
        }else{
            const result = await this.client.methods.contract.query(
                this.address,
                data,
                snapshotHash,
                accountHeight
            )
            if(!result)throw new Error(`The offchain call returned ${JSON.stringify(result)} !`)
            let decoded:any = {}
            if("decodeFunctionOutput" in vitejsAbi){
                decoded = vitejsAbi.decodeFunctionOutput(abi, result)
            }else{
                if(abi.outputs.find(e => e.type == "tuple"))throw new Error(`Cannot decode tuple: vite.js version is too old ! Please upgrade to at least 2.3.19.`)
                decoded = vitejsAbi.decodeParameters(abi.outputs.map(e => e.type), result) as any
            }
            const object = {}
            for(let i = 0; i < abi.outputs.length; i++){
                const output = abi.outputs[i]
                if(!output.name)continue
                object[output.name] = decoded[i]
            }
            return {
                map: object as any,
                raw: decoded
            }
        }
    }

    get methods():{
        [key: string]: Method
    }{
        return new Proxy({}, {
            get: (t, methodName:string) => {
                const abi = this.abi.find(e => e.type === "function" && e.name === methodName) as ABIFunction
                if(!abi)return null

                return new Method(this, abi)
            }
        })
    }

    get fallback(){
        const abi = this.abi.find(e => e.type === "fallback") as ABIFallback
        if(!abi)return null
        return new Method(this, abi)
    }

    get events():{
        [key: string]: Event
    }{
        return new Proxy({}, {
            get: (t, methodName:string) => {
                const abi = this.abi.find(e => e.type === "event" && e.name === methodName) as ABIEvent
                if(!abi)return null

                return new Event(this, abi)
            }
        })
    }
}

export class Event {
    abi:ABIEvent
    contract: Contract
    constructor(contract: Contract, abi:ABIEvent){
        this.contract = contract
        this.abi = abi
    }

    async subscribe<DecodedData = any>(startHeight: number, endHeight: number){
        const signature = vitejsAbi.encodeLogSignature(this.abi)
        const {events: subscription} = await this.contract.client.subscribe("vmlog", {
            [this.contract.address]: {
                startHeight: startHeight+"",
                endHeight: endHeight+""
            }
        })
        // now we need to filter it
        
        const events = new EventEmitter<{
            data: [data: SubscriptionResultTypes["vmlog"] & {
                decoded: DecodedData
            }],
            error: [error: Error],
            ready: [subscriptionId: string]
        }>()
        subscription
        .on("error", events.emit.bind(events, "error"))
        .on("ready", events.emit.bind(events, "ready"))
        .on("data", data => {
            // Not our function
            if(data.vmlog.topics[0] !== signature)return
            const decoded = this.decodeLog(
                data.vmlog.topics,
                data.vmlog.data
            )
            events.emit("data", {
                ...data,
                decoded: decoded as any
            })
        })

        return events
    }

    async fetchLogs<DecodedData = any>(startHeight = 0, endHeight = 0, topics: string[][] = []){
        const signature = vitejsAbi.encodeLogSignature(this.abi)
        const logs = await this.contract.client.methods.ledger.getVmLogsByFilter({
            [this.contract.address]: {
                startHeight: startHeight,
                endHeight: endHeight
            }
        }, [
            [signature],
            ...topics
        ])
        return (logs || []).map(data => {
            const decoded = this.decodeLog(
                data.vmlog.topics,
                data.vmlog.data
            )
            
            return {
                ...data,
                decoded
            }
        }) as {
            accountBlockHash: string,
            accountBlockHeight: string,
            address: string,
            vmlog: VmLog,
            removed: boolean,
            decoded: DecodedData
        }[]
    }

    decodeLog(topics: string[], data?: string){
        const decoded = vitejsAbi.decodeLog(
            this.abi, 
            Buffer.from(data||"", "base64").toString("hex"),
            topics
        )

        let i = 0
        for(const input of this.abi.inputs){
            if("result" in input){
                delete input["result"]
            }

            // fix vitejs lol
            if(input.indexed){
                switch(input.type){
                    case "tokenId": {
                        let value = decoded[i] as string
                        // already formatted
                        if(value.startsWith("tti_"))break
                        value = vitejsAbi.decodeParameter("tokenId", value)
                        decoded[i] = value
                        if(input.name){
                            decoded[input.name] = value
                        }
                    }
                }
            }
            i++
        }

        return decoded
    }
}

export class Method {
    abi:ABIFunction|ABIFallback
    contract: Contract
    constructor(contract: Contract, abi:ABIFunction|ABIFallback){
        this.contract = contract
        this.abi = abi
    }

    encodeCall(inputs: string[]):Buffer{
        const data = vitejsAbi.encodeFunctionCall(this.abi, inputs)
        return Buffer.from(data, "hex")
    }

    call(inputs: string[]):Promise<[Partial<AccountBlockV2>, GetterReturnType]>
    call(inputs: string[], address?: SigningAccount):Promise<[Partial<AccountBlockV2>, GetterReturnType]>
    call(inputs: string[], amount: NumberLike, tokenId: string, address: SigningAccount):Promise<[Partial<AccountBlockV2>, GetterReturnType]>
    async call(inputs: string[], amount?: SigningAccount|NumberLike, tokenId?: string, address?: SigningAccount):Promise<[Partial<AccountBlockV2>, GetterReturnType]>{
        if(!this.contract.offchain){
            // 0.8
            if([
                "view",
                "pure"
            ].includes(this.abi.stateMutability) && "name" in this.abi){
                // can be a getter
                return this.contract.get(this.abi.name, inputs)
                .then(e => [null, e])
            }
        }
        if(!tokenId){
            address = amount as Address
            amount = "0"
            tokenId = viteTokenId
        }
        if(this.abi.type === "fallback"){
            // normal call
            return viteQueue.queueAction(address.address, async () => {

                const accountBlock = AccountBlock.transfer(
                    this.contract.client,
                    {
                        producer: address.address,
                        recipient: this.contract.address,
                        amount: amount as NumberLike,
                        tokenId: tokenId
                    }
                )
                const tx = await sendTX(
                    address,
                    accountBlock
                )
                return [
                    tx,
                    null
                ]
            })
        }
        const data = this.encodeCall(inputs)
        return viteQueue.queueAction(address.address, async () => {
            const accountBlock = AccountBlock.transfer(
                this.contract.client,
                {
                    producer: address.address,
                    recipient: this.contract.address,
                    amount: amount as NumberLike,
                    tokenId: tokenId,
                    data: data
                }
            )
            if("fee" in this.abi){
                accountBlock.setFee(this.abi.fee)
            }
            let tx = await sendTX(address, accountBlock)
            const start = Date.now()
            // 5 minutes. way more than enough
            const timeout = start + 300*1000
            // eslint-disable-next-line no-constant-condition
            while(true){
                if(start >= timeout)throw new Error(`Transaction was not received by the smart contract. Make sure it has enough quota.`)
                await wait(1000)
                tx = await this.contract.client.methods.ledger.getAccountBlockByHash(tx.hash)
                if(tx.receiveBlockHash)break
            }
            const receiveTx = await this.contract.client.methods.ledger.getAccountBlockByHash(tx.receiveBlockHash)
            // 32 bytes receipt + 1 byte tx status
            const receipt = Buffer.from(receiveTx.data, "base64")
            let ret = null
            if(receipt[32] === 0){
                // success
                if(
                    this.abi.type == "function" &&
                    this.contract.client.flags.has(ClientFlags.ContractResults) &&
                    this.abi.outputs.length > 0
                ){
                    try{
                        const bytes = await this.contract.client.methods.ledger.getContractResponse(receiveTx.hash)
                        if(bytes.length > 0){
                            if(bytes.length % 32 === 0){
                                // decode result
                                ret = vitejsAbi.decodeFunctionOutput(this.abi, bytes.toString("hex"))
                            }
                        }
                    }catch{}
                }
            }else{
                let err = new Error(`Contract Execution failed: ${[
                    "Success",
                    "Revert",
                    "Depth Error"
                ][receipt[32]]}`)
                // fail
                if(this.contract.client.flags.has(ClientFlags.ContractResults)){
                    try{
                        const bytes = await this.contract.client.methods.ledger.getContractResponse(
                            receiveTx.hash
                        )
                        if(bytes.length > 0){
                            if((bytes.length - 4) % 32 !== 0){
                                err = new Error(`Contract Execution failed: ${bytes.slice(4).toString("utf8")}`)
                            }else{
                                // decode reason bytes
                                const result = vitejsAbi.decodeParameter("bytes", bytes.slice(4).toString("hex"))
                                err = new Error(`Contract Execution failed: ${Buffer.from(result, "hex").toString("utf8")}`)
                            }
                        }
                    }catch{}
                }
                throw err
            }
            return [
                tx,
                ret
            ]
        })
    }
}

export type GetterReturnType<mapType = {
    [name: string]: any
}> = {
    map: mapType,
    raw: any[]
}
export type ABI = ABIItem[]
export type ABIItem = (ABIEvent | ABIFunction | ABIFallback | ABIGetter | ABIConstructor) & {
    anonymous?: boolean
}
export type ABICommon = {
    payable?: boolean,
    constant?: boolean,
    stateMutability?: string
}
export interface ABIConstructor extends ABICommon {
    type: "constructor",
    inputs: Input[]
}
export interface ABIGetter extends ABICommon {
    type: "offchain",
    name: string,
    inputs: Input[],
    outputs: Output[]
}
export interface ABIFallback extends ABICommon {
    type: "fallback"
}
export interface ABIFunction extends ABICommon {
    type: "function",
    name: string,
    inputs: Input[],
    outputs: Output[],
    fee?: string
}
export interface ABIEvent {
    type: "event",
    name: string,
    inputs: EventInput[]
}
export interface EventInput extends Input {
    indexed?: boolean
}
export type Input = {
    name: string,
    type: string,
    internalType?: string,
    value?: string
}
export type Output = {
    name: string,
    type: string,
    internalType?: string
}