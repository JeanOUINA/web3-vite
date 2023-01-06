import { blake2bHex } from "blakejs"
import keccak256 from "keccak256"
import { maxUintsBigInt, uintsBigInt } from "../constants"
import { copyBigIntToBuffer, getTokenIdFromOriginalTokenId, resolveNumber, _Buffer as Buffer } from "../utils"
import { getOriginalAddressFromAddress } from "../wallet"
import { OpcodeName } from "./opcodes"
import { VirtualMachine } from "./vm"

export type InstructionFunc = (vm: VirtualMachine) => void|Promise<void>
const instructions = new Map<OpcodeName, InstructionFunc>()

instructions.set("ADD", ({ stack }) => {
    const [a, b] = stack.popN(2)
    const result = (a + b) % uintsBigInt.uint256
    stack.push(result)
})
instructions.set("MUL", ({ stack }) => {
    const [a, b] = stack.popN(2)
    const result = (a * b) % uintsBigInt.uint256
    stack.push(result)
})
instructions.set("SUB", ({ stack }) => {
    const [a, b] = stack.popN(2)
    let result = (a - b) % uintsBigInt.uint256
    if(result < 0){
        result = uintsBigInt.uint256 + result
    }
    stack.push(result)
})
instructions.set("DIV", ({ stack }) => {
    const [a, b] = stack.popN(2)
    if([a, b].includes(0n)){
        stack.push(0n)
    }else{
        stack.push(a / b)
    }
})
instructions.set("SDIV", ({ stack }) => {
    let [a, b] = stack.popN(2)
    if([a, b].includes(0n)){
        stack.push(0n)
    }else{
        if(a >= uintsBigInt.uint128){
            a -= uintsBigInt.uint256
        }
        if(b >= uintsBigInt.uint128){
            b -= uintsBigInt.uint256
        }
        let c = a / b
        if(c < 0n){
            c += uintsBigInt.uint256
        }
        stack.push(c)
    }
})
instructions.set("MOD", ({ stack }) => {
    let [a, b] = stack.popN(2)
    if(b === 0n){
        stack.push(0n)
    }else{
        const c = a % b
        stack.push(c)
    }
})
instructions.set("SMOD", ({ stack }) => {
    let [a, b] = stack.popN(2)
    if(b == 0n){
        stack.push(0n)
    }else{
        if(a >= uintsBigInt.uint128){
            a -= uintsBigInt.uint256
        }
        if(b >= uintsBigInt.uint128){
            b -= uintsBigInt.uint256
        }
        let c = a % b
        if(c < 0n){
            c += (b < 0n ? -b : b)
        }
        stack.push(c)
    }
})
instructions.set("ADDMOD", ({ stack }) => {
    let [a, b, c] = stack.popN(3)
    if(c === 0n){
        stack.push(0n)
    }else{
        stack.push((a + b) % c)
    }
})
instructions.set("MULMOD", ({ stack }) => {
    let [a, b, c] = stack.popN(3)
    if(c === 0n){
        stack.push(0n)
    }else{
        stack.push((a * b) % c)
    }
})
instructions.set("EXP", ({ stack }) => {
    let [base, exponent] = stack.popN(2)
    if(exponent === 0n){
        stack.push(1n)
    }else if(base === 0n){
        stack.push(0n)
    }else{
        let result = 1n
        while (exponent > 0n){
            if(exponent % 2n !== 0n){
                result = (result * base) % uintsBigInt.uint256
            }
            base = (base * base) % uintsBigInt.uint256
            exponent = exponent / 2n
        }
        stack.push(result)
    }
})
instructions.set("SIGNEXTEND", ({ stack }) => {
    let [k, val] = stack.popN(2)
    if(k < 31n){
        const signBit = k * 8n + 7n
        const mask = (1n << signBit) - 1n
        if((val >> signBit) & 1n){
            val = val | BigInt.asUintN(256, ~mask)
        }else{
            val = val & mask
        }
    }
    stack.push(val)
})

instructions.set("LT", ({ stack }) => {
    const [a, b] = stack.popN(2)
    stack.push(a < b ? 1n : 0n)
})
instructions.set("GT", ({ stack }) => {
    const [a, b] = stack.popN(2)
    stack.push(a > b ? 1n : 0n)
})
instructions.set("SLT", ({ stack }) => {
    let [a, b] = stack.popN(2)
    if(a >= uintsBigInt.uint128){
        a -= uintsBigInt.uint256
    }
    if(b >= uintsBigInt.uint128){
        b -= uintsBigInt.uint256
    }
    stack.push(a < b ? 1n : 0n)
})
instructions.set("SGT", ({ stack }) => {
    let [a, b] = stack.popN(2)
    if(a >= uintsBigInt.uint128){
        a -= uintsBigInt.uint256
    }
    if(b >= uintsBigInt.uint128){
        b -= uintsBigInt.uint256
    }
    stack.push(a > b ? 1n : 0n)
})
instructions.set("EQ", ({ stack }) => {
    const [a, b] = stack.popN(2)
    stack.push(a === b ? 1n : 0n)
})
instructions.set("ISZERO", ({ stack }) => {
    const a = stack.pop()
    stack.push(a === 0n ? 1n : 0n)
})
instructions.set("AND", ({ stack }) => {
    const [a, b] = stack.popN(2)
    stack.push(a & b)
})
instructions.set("OR", ({ stack }) => {
    const [a, b] = stack.popN(2)
    stack.push(a | b)
})
instructions.set("XOR", ({ stack }) => {
    const [a, b] = stack.popN(2)
    stack.push(a ^ b)
})
instructions.set("NOT", ({ stack }) => {
    const a = stack.pop()
    stack.push(BigInt.asUintN(256, ~a))
})
instructions.set("BYTE", ({ stack }) => {
    const [pos, word] = stack.popN(2)
    if(pos > 32n){
        stack.push(0n)
        return
    }

    const r = (word >> ((31n - pos) * 8n)) & 255n
    stack.push(r)
})
instructions.set("SHL", ({ stack }) => {
    const [a, b] = stack.popN(2)
    if(a >= 256n){
        stack.push(0n)
    }else{
        stack.push((b << a) & maxUintsBigInt.uint256)
    }
})
instructions.set("SHR", ({ stack }) => {
    const [a, b] = stack.popN(2)
    if(a >= 256n){
        stack.push(0n)
    }else{
        stack.push((b >> a) & maxUintsBigInt.uint256)
    }
})
instructions.set("SAR", ({ stack }) => {
    // no idea
    const [a, b] = stack.popN(2)

    let r:bigint
    const bComp = BigInt.asIntN(256, b)
    const isSigned = bComp < 0n
    if (a > 256n) {
        if (isSigned) {
            r = maxUintsBigInt.uint256
        } else {
            r = 0n
        }
        stack.push(r)
        return
    }

    const c = b >> a
    if (isSigned) {
        const shiftedOutWidth = 255n - a
        const mask = (maxUintsBigInt.uint256 >> shiftedOutWidth) << shiftedOutWidth
        r = c | mask
    } else {
        r = c
    }
    stack.push(r)
})

instructions.set("SHA3", vm => {
    const [offset, length] = vm.stack.popN(2)
    let data = Buffer.alloc(0)
    if (length !== BigInt(0)) {
      data = vm.memory.read(Number(offset), Number(length))
    }
    const r = BigInt("0x" + keccak256(data).toString("hex"))
    vm.stack.push(r)
})
instructions.set("BLAKE2B", vm => {
    const [offset, length] = vm.stack.popN(2)
    let data = Buffer.alloc(0)
    if (length !== BigInt(0)) {
      data = vm.memory.read(Number(offset), Number(length))
    }
    const r = BigInt("0x" + blake2bHex(data, null, 32))
    vm.stack.push(r)
})

instructions.set("ADDRESS", ({ stack, block }) => {
    stack.push(BigInt(`0x${getOriginalAddressFromAddress(block.toAddress)}`))
})
instructions.set("BALANCE", async ({ stack, block, dataProvider, offchain }) => {
    const tokenIdBigInt = stack.pop()
    const tokenIdBuff = Buffer.alloc(10)
    copyBigIntToBuffer(tokenIdBigInt, tokenIdBuff)
    const tokenId = getTokenIdFromOriginalTokenId(tokenIdBuff.toString("hex"))
    if(offchain){
        stack.push(0n)
        return
    }
    const balance = await dataProvider.getBalance(block.toAddress, tokenId)

    stack.push(BigInt(resolveNumber(balance).toString()))
})
instructions.set("CALLER", ({ stack, block, offchain }) => {
    if(offchain){
        stack.push(0n)
        return
    }

    stack.push(BigInt(`0x${getOriginalAddressFromAddress(block.fromAddress)}`))
})
instructions.set("CALLVALUE", ({ stack, block, offchain }) => {
    if(offchain){
        stack.push(0n)
        return
    }

    stack.push(BigInt(block.amount))
})