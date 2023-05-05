import { blake2b, blake2bHex } from "blakejs"
import nacl from "@sisi/tweetnacl-blake2b"
import { AddressType, isValidAddress, _Buffer as Buffer } from "./utils"
import * as bip39 from "bip39"
import { randomBytes } from "crypto"
import * as hd from "@sisi/ed25519-blake2b-hd-key"
import { AccountBlock } from "./accountBlock"

export abstract class SigningAccount {
    abstract address: string
    abstract sign(data:Buffer):Promise<Buffer>
    abstract signAccountBlock(accountBlock:AccountBlock):Promise<void>
}

export type Wallet = WalletMnemonics | WalletSeed
export class WalletSeed {
    static makeRandom(){
        return new WalletSeed(randomBytes(64))
    }
    seed: Buffer
    constructor(seed:Buffer){
        if(seed.length !== 64){
            throw new Error(`Invalid seed`)
        }
        this.seed = seed
    }

    get mainAddress(){
        return this.deriveAddress(0)
    }

    deriveAddress(index:number){
        const path = `m/44'/666666'/${index}'`
        const { key } = hd.derivePath(path, this.seed.toString("hex"))
        const { privateKey } = hd.getPublicKey(key)

        return new Address(Buffer.from(privateKey).toString("hex"))
    }
}
export class WalletMnemonics extends WalletSeed {
    static makeRandom(){
        return new WalletMnemonics(
            // 24 words
            bip39.generateMnemonic(256)
        )
    }
    static isMnemonicsValid(mnemonics:string){
        return bip39.validateMnemonic(mnemonics)
    }
    mnemonics: string
    constructor(mnemonics:string, password?:string){
        if(!WalletMnemonics.isMnemonicsValid(mnemonics)){
            throw new Error(`Invalid Mnemonics`)
        }
        super(bip39.mnemonicToSeedSync(mnemonics, password))
        this.mnemonics = mnemonics
    }
}

interface AddressCache {
    address:string
    originalAddress:string
    publicKey:Buffer
}
export class Address implements SigningAccount {
    privateKey: string
    private _cached:AddressCache
    constructor(privateKey: string){
        this.privateKey = privateKey
    }

    private get cached(){
        if(this._cached)return this._cached
        this._cached = {} as any

        const keyPair = nacl.sign.keyPair.fromSecretKey(Buffer.from(this.privateKey, "hex"))

        this._cached.publicKey = Buffer.from(keyPair.publicKey)
        this._cached.originalAddress = blake2bHex(this.cached.publicKey, null, 20) + "00"
        this._cached.address = getAddressFromOriginalAddress(this.cached.originalAddress)

        return this._cached
    }
    get publicKey(){
        return this.cached.publicKey
    }
    get address(){
        return this.cached.address
    }
    get originalAddress(){
        return this.cached.originalAddress
    }

    async signAccountBlock(accountBlock:AccountBlock){
        if(accountBlock.producer !== this.address){
            throw new Error(`Producer ${accountBlock.producer} does not match address ${this.address}`)
        }
        const signature = await this.sign(accountBlock.hash)
        accountBlock
        .setPublicKey(this.publicKey)
        .setSignature(signature)
    }

    async sign(data:Buffer):Promise<Buffer>{
        const keyPair = nacl.sign.keyPair.fromSecretKey(Buffer.from(this.privateKey, "hex"))
        return Buffer.from(nacl.sign.detached(data, keyPair.secretKey))
    }
}

export function getAddressFromOriginalAddress(originalAddress:string):string{
    if(originalAddress.length != 42)throw new Error(`Invalid originalAddress`)

    const address = Buffer.from(originalAddress.slice(0, -2), "hex")
    const isContract = Number(originalAddress.slice(-2))
    if(isContract > 1)throw new Error(`Invalid isContract byte`)

    const checksum = blake2b(address, null, 5)
    if(isContract){
        for(let i = 0; i < checksum.length; i++){
            checksum[i] ^= 0xff
        }
    }
    return `vite_${
        address.toString("hex")
    }${
        Buffer.from(checksum).toString("hex")
    }`
}
export function getOriginalAddressFromAddress(address:string):string{
    const addressType = isValidAddress(address)
    if(!addressType)throw new Error(`Invalid address`)
    
    let originalAddress = address.slice(5, -10) + "0"
    if(addressType === AddressType.Contract){
        originalAddress += "1"
    }else{
        originalAddress += "0"
    }

    return originalAddress
}