import BigNumber from "bignumber.js"
import { OpcodeName, opcodes } from "./opcodes"
import { _Buffer as Buffer } from "../utils"

export interface Instruction {
    name: OpcodeName,
    isPush: boolean,
    code: number,
    data?: Buffer,
    i: number
}

export function parseOpcodes(code: Buffer|string):Instruction[]{
    if(typeof code === "string"){
        if(code.startsWith("0x"))code = code.replace("0x", "")
        try{
            code = Buffer.from(code, "hex")
        }catch{
            code = Buffer.from(code as string, "base64")
        }
    }
    // code should be a buffer
    const realCode = code as Buffer
    const instructions:Instruction[] = []
    let i = 0
    // eslint-disable-next-line no-constant-condition
    while(true){
        if(i >= realCode.length)break
        const code = realCode[i]
        const op = opcodes.get(code)
        if(!op){
            i++
            continue
        }//throw new Error(`Unknown opcode: ${i}:${code}`)
        const instruction:Instruction = {
            isPush: false,
            name: op.name,
            code: op.code,
            data: null,
            i: i
        }
        if(/^PUSH\d{1,2}$/.test(op.name)){
            const startSlice = i+1
            const sliceLen = Number(op.name.slice(4))
            instruction.isPush = true
            instruction.data = realCode.slice(
                startSlice, 
                startSlice+sliceLen
            )
            i += sliceLen
            if(sliceLen !== instruction.data.length){
                throw new Error(`Invalid PUSH: Len:${instruction.data.length} Wanted Len:${sliceLen}`)
            }
        }
        instructions.push(instruction)
        i++
    }

    return instructions
}

export function parseFunctions(instructions: Instruction[]){
    // we gotta find the PUSH4 opcodes surrounded by jumpi and shit
    let index:number
    for(let i = 0;i<instructions.length;i++){
        // find function selector
        // just trying to find a pattern
        // first instruction is a jumpdest
        if(instructions[i]?.name !== "JUMPDEST")continue
        // the next instruction is a push1, the min length of the data for the selector (which is 4 bytes)
        if(instructions[i+1]?.name !== "PUSH1" || instructions[i+1].data[0] !== 4)continue
        // calldatasize, pushes the msg.data size into the stack
        if(instructions[i+2]?.name !== "CALLDATASIZE")continue
        // Compare the size, if the size is less than the min
        if(instructions[i+3]?.name !== "LT")continue
        // The next one is a PUSHx, the size depends on the contract size as it's for a jump, we're just going to be dynamic here
        if(!instructions[i+4]?.isPush)continue
        // conditional JUMPI
        if(instructions[i+5]?.name !== "JUMPI")continue
        // Load the data, with offset 0
        if(instructions[i+6]?.name !== "PUSH1" || instructions[i+6].data[0] !== 0)continue
        // Load the data, with offset 0
        if(instructions[i+7]?.name !== "CALLDATALOAD")continue
        // Load the data, with offset 0
        if(instructions[i+8]?.name !== "PUSH1")continue
        // Load the data, with offset 0
        if(instructions[i+9]?.name !== "SHR")continue
        // the dup1 op is the first of the selector
        index = i+10
        break
    }
    if(!index){
        // we might be in 0.4.3
        for(let i = 0;i<instructions.length;i++){
            // find function selector
            // just trying to find a pattern
            // the first instruction is a push1, the min length of the data for the selector (which is 4 bytes)
            if(instructions[i]?.name !== "PUSH1" || instructions[i].data[0] !== 4)continue
            // calldatasize, pushes the msg.data size into the stack
            if(instructions[i+1]?.name !== "CALLDATASIZE")continue
            // Compare the size, if the size is less than the min
            if(instructions[i+2]?.name !== "LT")continue
            // The next one is a PUSHx, the size depends on the contract size as it's for a jump, we're just going to be dynamic here
            if(!instructions[i+3]?.isPush)continue
            // conditional JUMPI
            if(instructions[i+4]?.name !== "JUMPI")continue
            // Load the data, with offset 0
            if(instructions[i+5]?.name !== "PUSH1" || instructions[i+5].data[0] !== 0)continue
            // Load the data with offset
            if(instructions[i+6]?.name !== "CALLDATALOAD")continue
            // idk PUSH29 in my case
            if(instructions[i+7]?.isPush !== true)continue
            if(instructions[i+8]?.name !== "SWAP1")continue
            if(instructions[i+9]?.name !== "DIV")continue
            if(instructions[i+10]?.name !== "PUSH4")continue
            if(instructions[i+11]?.name !== "AND")continue
            // the dup1 op is the first of the selector
            index = i+12
            break
        }
    }

    const functions = []
    let i = index
    // eslint-disable-next-line no-constant-condition
    while(true){
        const dup1 = instructions[i]
        if(dup1?.name !== "DUP1")break
        const push4 = instructions[i+1]
        if(push4?.name !== "PUSH4")break
        const eq = instructions[i+2]
        if(eq?.name !== "EQ")break
        const pushx = instructions[i+3]
        if(!pushx?.isPush)break
        const jumpi = instructions[i+4]
        if(jumpi?.name !== "JUMPI")break
        functions.push({
            signature: push4.data.toString("hex"),
            location: new BigNumber("0x"+pushx.data.toString("hex")).toNumber(),
            name: null //knownFunctions[push4.data.toString("hex")] || null
        })
        i = i+5
    }
    return functions
}

export function parseEvents(instructions: Instruction[]){
    // we gotta find the PUSH32 opcodes surrounded by PUSH and shit
    const events = []
    for(let i = 0;i<instructions.length;i++){
        // find function selector
        // just trying to find a pattern
        // first instruction is a jumpdest
        if(instructions[i].name !== "JUMPDEST")continue
        // the next instruction is a push1, I don't really know the purpose of this one
        if(instructions[i+1].name !== "PUSH1" || instructions[i+1].data[0] !== 0)continue
        // push32, contains the topic
        if(instructions[i+2].name !== "PUSH32")continue
        events.push({
            topic: instructions[i+2].data.toString("hex"),
            location: instructions[i+2].i,
            name: null//knownEvents[instructions[i+2].data.toString("hex")]
        })
    }
    
    return events
}