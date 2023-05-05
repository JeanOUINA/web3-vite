import BigNumber from "bignumber.js"
import blake, { blake2b } from "blakejs"
import { getAddressFromOriginalAddress, getOriginalAddressFromAddress } from "./wallet"

export let _Buffer:typeof Buffer
try{
    _Buffer = Buffer
}catch(err){
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _Buffer = require("buffer").Buffer
}
export function setBufferImplementation(__Buffer: typeof Buffer){
    _Buffer = __Buffer
}
export type BufferLike = string | Buffer
export function resolveBuffer(input: BufferLike): Buffer {
    if (typeof input === "string") {
        if (input.startsWith("0x")){
            input = input.replace("0x", "")
            input = _Buffer.from(input, "hex")
        }else{
            try{
                input = _Buffer.from(input as string, "hex")
            }catch{
                input = _Buffer.from(input as string, "base64")
            }
        }
    }
    if(!_Buffer.isBuffer(input)){
        throw new Error("Invalid Buffer")
    }
    return input
}

export type NumberLike = string | number | bigint | BigNumber
export function resolveNumber(number: NumberLike): BigNumber {
    let result: BigNumber
    if(number instanceof BigNumber){
        result = number
    }else if(typeof number === "bigint"){
        result = new BigNumber(number.toString())
    }else{
        result = new BigNumber(number)
    }

    if(result.isNaN())throw new Error(`Invalid number: ${number}`)
    return result
}
export function resolveInteger(number: NumberLike): BigNumber {
    const result = resolveNumber(number)
    if(!result.isInteger())throw new Error(`Invalid integer: ${number}`)
    return result
}
export function resolveUnsignedInteger(number: NumberLike): BigNumber {
    const result = resolveInteger(number)
    if(result.isNegative())throw new Error(`Invalid unsigned integer: ${number}`)
    return result
}

export function wait(ms: number):Promise<void>{
    return new Promise(r=>setTimeout(r,ms))
}
export function nextTick():Promise<void>{
    return new Promise(r=>setImmediate(r))
}

export function makePromise<T = any>(): [Promise<T>, (data:T)=>void, (reason:any)=>void]{
    let resolve, reject
    const promise = new Promise<T>((r, j) => (resolve = r, reject = j))
    return [promise, resolve, reject]
}

export const TOKENID_REGEX = /^tti_([abcdef\d]{2}){12}$/
export function isValidTokenId(tokenId: string){
    if(!TOKENID_REGEX.test(tokenId))return false

    const originalToken = _Buffer.from(tokenId.slice(4, -4), "hex")
    const checksum = _Buffer.from(tokenId.slice(-4), "hex")
    const calcChecksum = _Buffer.from(blake.blake2b(originalToken, null, 2))
    return checksum.equals(calcChecksum)
}

export enum AddressType {
    Invalid,
    Address,
    Contract
}
export const ADDRESS_REGEX = /^vite_([abcdef\d]{2}){25}$/
export function isValidAddress(address: string){
    if(!ADDRESS_REGEX.test(address))return false

    const originalAddress = _Buffer.from(address.slice(5, -10), "hex")
    const checksum = _Buffer.from(address.slice(-10), "hex")
    const calcChecksum = _Buffer.from(blake.blake2b(originalAddress, null, 5))
    if(checksum.equals(calcChecksum))return AddressType.Address

    for(let i = 0; i < checksum.length; i++){
        checksum[i] ^= 0xff
    }

    if(checksum.equals(calcChecksum))return AddressType.Contract

    return AddressType.Invalid
}

export function copyBigIntToBuffer(number: bigint, target: Buffer){
    for(let i = BigInt(target.length-1); i >= 0n; i--){
        if(number == 0n)break
        target[Number(i)] = Number(number % 256n)
        // same as / 2**8
        number = number >> 8n
    }
}

export function createContractAddress(creator:string, height:string, previousHash:string){
    const originalAddress = _Buffer.from(
        getOriginalAddressFromAddress(creator),
        "hex"
    )
    const heightBuffer = _Buffer.alloc(8)
    copyBigIntToBuffer(BigInt(height), heightBuffer)
    const previousHashBuffer = _Buffer.from(previousHash, "hex")
    const originalContractAddress = _Buffer.alloc(21)

    const data = _Buffer.concat(
        [
            originalAddress,
            heightBuffer,
            previousHashBuffer
        ]
    )
    // hash it and copy to contract address
    _Buffer.from(blake2b(data, null, 20))
    .copy(originalContractAddress)

    // set isContract byte
    originalContractAddress[20] = 0x01
    return getAddressFromOriginalAddress(originalContractAddress.toString("hex"))
}

export function isValidHex(hex: string){
    return /^([abcdef\d]{2})+$/.test(hex)
}
export function isValidHash(hex: string){
    return isValidHex(hex) && hex.length === 64
}

export function getOriginalTokenIdFromTokenId(tokenId: string){
    if(!isValidTokenId(tokenId))throw new Error(`Invalid token id: ${tokenId}`)
    return tokenId.slice(4, -4)
}
export function getTokenIdFromOriginalTokenId(originalTokenId: string){
    if(!isValidHex(originalTokenId) || originalTokenId.length !== 20)throw new Error(`Invalid original token id: ${originalTokenId}`)
    const originalToken = _Buffer.from(originalTokenId, "hex")
    const checksum = _Buffer.from(
        blake.blake2b(originalToken, null, 2)
    )
    return `tti_${originalTokenId}${checksum.toString("hex")}`
}