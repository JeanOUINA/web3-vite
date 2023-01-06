import BigNumber from "bignumber.js";
import nacl from "@sisi/tweetnacl-blake2b";
import { maxUints, viteTokenId } from "./constants";
import { AccountBlockV2, BlockType } from "./types";
import { Client } from "./client";
import { BufferLike, isValidHash, isValidTokenId, NumberLike, resolveBuffer, resolveUnsignedInteger, isValidAddress, copyBigIntToBuffer, getOriginalTokenIdFromTokenId, _Buffer as Buffer } from "./utils";
import { getOriginalAddressFromAddress } from "./wallet";
import { blake2b, blake2bHex } from "blakejs";

export class AccountBlock {
    static transfer(
        client:Client,
        {
            producer,
            recipient,
            amount,
            tokenId = viteTokenId,
            data
        }:{
            producer:string,
            recipient:string,
            amount:NumberLike,
            tokenId?:string,
            data?:BufferLike
        }
    ):AccountBlock{
        if(!isValidTokenId(tokenId))throw new Error("Invalid token id")
        const amt = resolveUnsignedInteger(amount)
        const d = resolveBuffer(data)
        
        const accountBlock = new AccountBlock(client)
        accountBlock
        .setBlockType(BlockType.SendCall)
        .setProducer(producer)
        .setRecipient(recipient)
        .setAmount(amt)
        .setTokenId(tokenId)
        .setData(d)
        return accountBlock
    }

    static receive(
        client:Client,
        {
            producer,
            sendBlockHash
        }:{
            producer:string,
            sendBlockHash:string
        }
    ):AccountBlock{
        const accountBlock = new AccountBlock(client)
        accountBlock
        .setBlockType(BlockType.Receive)
        .setProducer(producer)
        .setSendBlockHash(sendBlockHash)
        return accountBlock
    }
    client: Client
    constructor(
        client:Client
    ){
        this.client = client
    }

    get isReceive(){
        return [
            BlockType.Receive,
            BlockType.ReceiveError,
            BlockType.GenesisReceive
        ].includes(this.blockType)
    }
    get isSend(){
        return !this.isReceive && this.blockType !== undefined
    }
    blockType: BlockType
    setBlockType(blockType: BlockType){
        if(BlockType[blockType] === undefined)throw new Error("Invalid block type")
        this.blockType = blockType
        return this
    }
    height: BigNumber
    setHeight(height: NumberLike){
        this.height = resolveUnsignedInteger(height)
        return this
    }
    previousHash: Buffer
    setPreviousHash(previousHash: BufferLike){
        const p = resolveBuffer(previousHash)
        if(p.length !== 32)throw new Error("Invalid previous hash")
        this.previousHash = p
        return this
    }
    recipient: string
    setRecipient(recipient: string){
        if(!isValidAddress(recipient))throw new Error("Invalid recipient address")
        this.recipient = recipient
        return this
    }
    producer: string
    setProducer(producer: string){
        if(!isValidAddress(producer))throw new Error("Invalid producer address")
        this.producer = producer
        return this
    }
    publicKey: Buffer
    setPublicKey(publicKey: BufferLike){
        const buffer = resolveBuffer(publicKey)
        if(buffer.length !== nacl.sign.publicKeyLength)throw new Error("Invalid public key")
        this.publicKey = buffer
        return this
    }
    sendBlockHash: string
    setSendBlockHash(sendBlockHash: string){
        if(!this.isReceive)throw new Error("Can only set send block hash on receive blocks")
        if(!isValidHash(sendBlockHash))throw new Error("Invalid send block hash")
        this.sendBlockHash = sendBlockHash
        return this
    }
    tokenId: string = viteTokenId
    setTokenId(tokenId: string){
        if(!isValidTokenId(tokenId))throw new Error("Invalid token id")
        this.tokenId = tokenId
        return this
    }
    amount: BigNumber = new BigNumber(0)
    setAmount(amount: NumberLike){
        const amt = resolveUnsignedInteger(amount)
        if(amt.isGreaterThan(maxUints.uint256))throw new Error("Amount is too large")
        this.amount = amt
        return this
    }
    fee: BigNumber = new BigNumber(0)
    setFee(fee: NumberLike){
        const f = resolveUnsignedInteger(fee)
        if(f.isGreaterThan(maxUints.uint256))throw new Error("Fee is too large")
        this.fee = f
        return this
    }
    data: Buffer = Buffer.alloc(0)
    setData(data: BufferLike){
        const d = resolveBuffer(data)
        if(maxUints.uint16.isLessThan(data.length))throw new Error("Data is too large")
        this.data = d
        return this
    }
    difficulty: BigNumber
    setDifficulty(difficulty: NumberLike){
        if(difficulty == null){
            this.difficulty = undefined
        }else{
            this.difficulty = resolveUnsignedInteger(difficulty)
        }
        return this
    }
    nonce: Buffer
    setNonce(nonce: BufferLike){
        const n = resolveBuffer(nonce)
        if(n.length !== 8)throw new Error("Invalid nonce")
        this.nonce = n
        return this
    }
    signature: Buffer
    setSignature(signature: BufferLike){
        this.signature = resolveBuffer(signature)
        return this
    }

    async getPreviousHash(){
        const block = await this.client.methods.ledger.getLatestAccountBlock(this.producer)
        this.setPreviousHash(block?.hash || Buffer.alloc(32))
        this.setHeight(BigInt(block?.height || 0) + 1n)
        return block?.hash
    }
    async getDifficulty(){
        const difficulty = await this.client.methods.ledger.getPoWDifficulty({
            address: this.producer,
            blockType: this.blockType,
            data: this.data.toString("base64"),
            previousHash: this.previousHash.toString("hex"),
            toAddress: this.isSend ? this.recipient : null
        })
        this.setDifficulty(difficulty.difficulty || null)
        return difficulty
    }
    async computePoW(difficulty:NumberLike = this.difficulty){
        const diff = resolveUnsignedInteger(difficulty)
        this.setDifficulty(diff)

        const getNonceHash = blake2bHex(Buffer.concat([
            Buffer.from(
                getOriginalAddressFromAddress(this.producer),
                "hex"
            ),
            this.previousHash
        ]), null, 32)

        const nonce = await this.client.methods.util.getPoWNonce(
            diff.toFixed(),
            getNonceHash
        )
        this.setNonce(nonce)
        return nonce
    }
    async broadcast(){
        await this.client.methods.ledger.sendRawTransaction(this.accountBlock)
        return this.accountBlock
    }

    get isValid():boolean{
        if(BlockType[this.blockType] === undefined)return false
        if(this.height === undefined)return false
        if(this.previousHash?.length !== 32)return false
        if(this.isSend){
            if(!isValidAddress(this.recipient))return false
            if(!isValidTokenId(this.tokenId))return false
            if(!this.amount.isInteger())return false
            if(!this.fee.isInteger())return false
            if(!this.amount.isPositive())return false
            if(!this.fee.isPositive())return false
        }else{
            if(!isValidHash(this.sendBlockHash))return false
        }
        if(!isValidAddress(this.producer))return false
        if(this.publicKey?.length !== nacl.sign.publicKeyLength)return false
        if(this.data === undefined)return false
        if(this.nonce){
            if(this.difficulty === undefined)return false
            if(this.nonce.length !== 8)return false
        }
        if(this.signature === undefined)return false
        return true
    }

    get partialAccountBlock(){
        if(this.isSend){
            // address, amount, blockType, data, toAddress, tokenId
            const block:Partial<AccountBlockV2> = {
                address: this.producer,
                amount: this.amount.toFixed(),
                blockType: this.blockType,
                data: this.data?.toString("base64") || "",
                toAddress: this.recipient,
                tokenId: this.tokenId
            }
            return block
        }else{
            // address, blockType, data, sendBlockHash
            const block:Partial<AccountBlockV2> = {
                address: this.producer,
                blockType: this.blockType,
                data: this.data?.toString("base64") || "",
                sendBlockHash: this.sendBlockHash
            }
            return block
        }
    }

    get accountBlock(){
        if(!this.isValid)throw new Error("Invalid account block")
        const block:Partial<AccountBlockV2> = {
            blockType: this.blockType,
            height: this.height?.toString(),
            previousHash: this.previousHash.toString("hex"),
            address: this.producer,
            publicKey: this.publicKey.toString("base64"),
            signature: this.signature.toString("base64"),
            hash: this.hash.toString("hex")
        }
        if(this.isReceive){
            block.sendBlockHash = this.sendBlockHash
        }else if(this.isSend){
            block.toAddress = this.recipient
            block.fromAddress = this.producer
            block.tokenId = this.tokenId
            block.amount = this.amount.toFixed()
            block.fee = this.fee.toFixed()
            block.data = this.data.toString("base64")
        }

        if(this.difficulty !== undefined){
            block.difficulty = this.difficulty.toFixed()
            block.nonce = this.nonce.toString("base64")
        }
        return block
    }

    get hash(){
        const buffers:Buffer[] = []

        buffers.push(Buffer.from([this.blockType]))

        buffers.push(Buffer.from(this.previousHash))

        const heightBuffer = Buffer.alloc(8)
        copyBigIntToBuffer(BigInt(this.height.toFixed()), heightBuffer)
        buffers.push(heightBuffer)

        buffers.push(Buffer.from(getOriginalAddressFromAddress(this.producer), "hex"))

        if(this.isSend){
            buffers.push(Buffer.from(getOriginalAddressFromAddress(this.recipient), "hex"))

            const amountBuffer = Buffer.alloc(32)
            copyBigIntToBuffer(BigInt(this.amount.toFixed()), amountBuffer)
            buffers.push(amountBuffer)

            buffers.push(Buffer.from(getOriginalTokenIdFromTokenId(this.tokenId), "hex"))
        }else if(this.isReceive){
            buffers.push(Buffer.from(this.sendBlockHash, "hex"))
        }else{
            throw new Error("Invalid block type")
        }

        if(this.data.length)buffers.push(Buffer.from(blake2b(this.data, null, 32)))

        const feeBuffer = Buffer.alloc(32)
        copyBigIntToBuffer(BigInt(this.fee.toFixed()), feeBuffer)
        buffers.push(feeBuffer)

        // TODO: Allow arbitrary account block that can't be sent on network
        // buffers.push(Buffer.from(this.vmlogHash, "hex"))

        if(this.nonce?.length){
            buffers.push(Buffer.from(this.nonce))
        }else{
            buffers.push(Buffer.alloc(8))
        }
        
        /*
        for(const sendBlock of this.triggeredSendBlockList){
            buffers.push(Buffer.from(sendBlock.hash, "hex"))
        }
        */

        return Buffer.from(
            blake2b(Buffer.concat(buffers), null, 32)
        )
    }
}