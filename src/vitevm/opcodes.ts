export type OpcodeName = "STOP" | "ADD" | "MUL" | "SUB" | "DIV" | "SDIV" | "MOD" | "SMOD" | "ADDMOD" | "MULMOD" | "EXP" | "SIGNEXTEND" | "LT" | "GT" | "SLT" | "SGT" | "EQ" | "ISZERO" | "AND" | "OR" | "XOR" | "NOT" | "BYTE" | "SHL" | "SHR" | "SAR" | "SHA3" | "BLAKE2B" | "ADDRESS" | "BALANCE" | "ORIGIN" | "CALLER" | "CALLVALUE" | "CALLDATALOAD" | "CALLDATASIZE" | "CALLDATACOPY" | "CODESIZE" | "CODECOPY" | "GASPRICE" | "EXTCODESIZE" | "EXTCODECOPY" | "RETURNDATASIZE" | "RETURNDATACOPY" | "EXTCODEHASH" | "BLOCKHASH" | "COINBASE" | "TIMESTAMP" | "HEIGHT" | "DIFFICULTY" | "GASLIMIT" | "TOKENID" | "ACCOUNTHEIGHT" | "PREVHASH" | "FROMHASH" | "SEED" | "RANDOM" | "POP" | "MLOAD" | "MSTORE" | "MSTORE8" | "SLOAD" | "SSTORE" | "JUMP" | "JUMPI" | "PC" | "MSIZE" | "GAS" | "JUMPDEST" | "PUSH1" | "PUSH2" | "PUSH3" | "PUSH4" | "PUSH5" | "PUSH6" | "PUSH7" | "PUSH8" | "PUSH9" | "PUSH10" | "PUSH11" | "PUSH12" | "PUSH13" | "PUSH14" | "PUSH15" | "PUSH16" | "PUSH17" | "PUSH18" | "PUSH19" | "PUSH20" | "PUSH21" | "PUSH22" | "PUSH23" | "PUSH24" | "PUSH25" | "PUSH26" | "PUSH27" | "PUSH28" | "PUSH29" | "PUSH30" | "PUSH31" | "PUSH32" | "DUP1" | "DUP2" | "DUP3" | "DUP4" | "DUP5" | "DUP6" | "DUP7" | "DUP8" | "DUP9" | "DUP10" | "DUP11" | "DUP12" | "DUP13" | "DUP14" | "DUP15" | "DUP16" | "SWAP1" | "SWAP2" | "SWAP3" | "SWAP4" | "SWAP5" | "SWAP6" | "SWAP7" | "SWAP8" | "SWAP9" | "SWAP10" | "SWAP11" | "SWAP12" | "SWAP13" | "SWAP14" | "SWAP15" | "SWAP16" | "LOG0" | "LOG1" | "LOG2" | "LOG3" | "LOG4" | "CREATE" | "CALL" | "CALL2" | "RETURN" | "DELEGATECALL" | "STATICCALL" | "REVERT" | "INVALID" | "SELFDESTRUCT"

export class Opcode {
    code: number
    name: OpcodeName
    constructor(opcode: number, name: OpcodeName){
        this.code = opcode
        this.name = name
    }
}

export const opcodes = new Map<number | OpcodeName, Opcode>()
// https://github.com/vitelabs/go-vite/blob/master/vm/opcodes.go#L22
// 0x0 range - arithmetic ops.
opcodes.set(0x00, new Opcode(0x00, "STOP"))
opcodes.set(0x01, new Opcode(0x01, "ADD"))
opcodes.set(0x02, new Opcode(0x02, "MUL"))
opcodes.set(0x03, new Opcode(0x03, "SUB"))
opcodes.set(0x04, new Opcode(0x04, "DIV"))
opcodes.set(0x05, new Opcode(0x05, "SDIV"))
opcodes.set(0x06, new Opcode(0x06, "MOD"))
opcodes.set(0x07, new Opcode(0x07, "SMOD"))
opcodes.set(0x08, new Opcode(0x08, "ADDMOD"))
opcodes.set(0x09, new Opcode(0x09, "MULMOD"))
opcodes.set(0x0a, new Opcode(0x0a, "EXP"))
opcodes.set(0x0b, new Opcode(0x0b, "SIGNEXTEND"))

// https://github.com/vitelabs/go-vite/blob/master/vm/opcodes.go#L38
// 0x10 range - comparison ops.
opcodes.set(0x10, new Opcode(0x10, "LT"))
opcodes.set(0x11, new Opcode(0x11, "GT"))
opcodes.set(0x12, new Opcode(0x12, "SLT"))
opcodes.set(0x13, new Opcode(0x13, "SGT"))
opcodes.set(0x14, new Opcode(0x14, "EQ"))
opcodes.set(0x15, new Opcode(0x15, "ISZERO"))
opcodes.set(0x16, new Opcode(0x16, "AND"))
opcodes.set(0x17, new Opcode(0x17, "OR"))
opcodes.set(0x18, new Opcode(0x18, "XOR"))
opcodes.set(0x19, new Opcode(0x19, "NOT"))
opcodes.set(0x1a, new Opcode(0x1a, "BYTE"))
opcodes.set(0x1b, new Opcode(0x1b, "SHL"))
opcodes.set(0x1c, new Opcode(0x1c, "SHR"))
opcodes.set(0x1d, new Opcode(0x1d, "SAR"))

// https://github.com/vitelabs/go-vite/blob/master/vm/opcodes.go#L56
// 0x20 range - hash ops.
opcodes.set(0x20, new Opcode(0x20, "SHA3"))
opcodes.set(0x21, new Opcode(0x21, "BLAKE2B"))

// https://github.com/vitelabs/go-vite/blob/master/vm/opcodes.go#L62
// 0x30 range - closure state.
opcodes.set(0x30, new Opcode(0x30, "ADDRESS"))
opcodes.set(0x31, new Opcode(0x31, "BALANCE"))
opcodes.set(0x32, new Opcode(0x32, "ORIGIN"))
opcodes.set(0x33, new Opcode(0x33, "CALLER"))
opcodes.set(0x34, new Opcode(0x34, "CALLVALUE"))
opcodes.set(0x35, new Opcode(0x35, "CALLDATALOAD"))
opcodes.set(0x36, new Opcode(0x36, "CALLDATASIZE"))
opcodes.set(0x37, new Opcode(0x37, "CALLDATACOPY"))
opcodes.set(0x38, new Opcode(0x38, "CODESIZE"))
opcodes.set(0x39, new Opcode(0x39, "CODECOPY"))
opcodes.set(0x3a, new Opcode(0x3a, "GASPRICE"))
opcodes.set(0x3b, new Opcode(0x3b, "EXTCODESIZE"))
opcodes.set(0x3c, new Opcode(0x3c, "EXTCODECOPY"))
opcodes.set(0x3d, new Opcode(0x3d, "RETURNDATASIZE"))
opcodes.set(0x3e, new Opcode(0x3e, "RETURNDATACOPY"))
opcodes.set(0x3f, new Opcode(0x3f, "EXTCODEHASH"))

// https://github.com/vitelabs/go-vite/blob/master/vm/opcodes.go#L82
// 0x40 range - block operations.
opcodes.set(0x40, new Opcode(0x40, "BLOCKHASH"))
opcodes.set(0x41, new Opcode(0x41, "COINBASE"))
opcodes.set(0x42, new Opcode(0x42, "TIMESTAMP"))
opcodes.set(0x43, new Opcode(0x43, "HEIGHT"))
opcodes.set(0x44, new Opcode(0x44, "DIFFICULTY"))
opcodes.set(0x45, new Opcode(0x45, "GASLIMIT"))
opcodes.set(0x46, new Opcode(0x46, "TOKENID"))
opcodes.set(0x47, new Opcode(0x47, "ACCOUNTHEIGHT"))
opcodes.set(0x48, new Opcode(0x48, "PREVHASH"))
opcodes.set(0x49, new Opcode(0x49, "FROMHASH"))
opcodes.set(0x4a, new Opcode(0x4a, "SEED"))
opcodes.set(0x4b, new Opcode(0x4b, "RANDOM"))

// https://github.com/vitelabs/go-vite/blob/master/vm/opcodes.go#L98
// 0x50 range - 'storage' and execution.
opcodes.set(0x50, new Opcode(0x50, "POP"))
opcodes.set(0x51, new Opcode(0x51, "MLOAD"))
opcodes.set(0x52, new Opcode(0x52, "MSTORE"))
opcodes.set(0x53, new Opcode(0x53, "MSTORE8"))
opcodes.set(0x54, new Opcode(0x54, "SLOAD"))
opcodes.set(0x55, new Opcode(0x55, "SSTORE"))
opcodes.set(0x56, new Opcode(0x56, "JUMP"))
opcodes.set(0x57, new Opcode(0x57, "JUMPI"))
opcodes.set(0x58, new Opcode(0x58, "PC"))
opcodes.set(0x59, new Opcode(0x59, "MSIZE"))
opcodes.set(0x5a, new Opcode(0x5a, "GAS"))
opcodes.set(0x5b, new Opcode(0x5b, "JUMPDEST"))

// https://github.com/vitelabs/go-vite/blob/master/vm/opcodes.go#L114
// 0x60 range.
opcodes.set(0x60, new Opcode(0x60, "PUSH1"))
opcodes.set(0x61, new Opcode(0x61, "PUSH2"))
opcodes.set(0x62, new Opcode(0x62, "PUSH3"))
opcodes.set(0x63, new Opcode(0x63, "PUSH4"))
opcodes.set(0x64, new Opcode(0x64, "PUSH5"))
opcodes.set(0x65, new Opcode(0x65, "PUSH6"))
opcodes.set(0x66, new Opcode(0x66, "PUSH7"))
opcodes.set(0x67, new Opcode(0x67, "PUSH8"))
opcodes.set(0x68, new Opcode(0x68, "PUSH9"))
opcodes.set(0x69, new Opcode(0x69, "PUSH10"))
opcodes.set(0x6a, new Opcode(0x6a, "PUSH11"))
opcodes.set(0x6b, new Opcode(0x6b, "PUSH12"))
opcodes.set(0x6c, new Opcode(0x6c, "PUSH13"))
opcodes.set(0x6d, new Opcode(0x6d, "PUSH14"))
opcodes.set(0x6e, new Opcode(0x6e, "PUSH15"))
opcodes.set(0x6f, new Opcode(0x6f, "PUSH16"))
opcodes.set(0x70, new Opcode(0x70, "PUSH17"))
opcodes.set(0x71, new Opcode(0x71, "PUSH18"))
opcodes.set(0x72, new Opcode(0x72, "PUSH19"))
opcodes.set(0x73, new Opcode(0x73, "PUSH20"))
opcodes.set(0x74, new Opcode(0x74, "PUSH21"))
opcodes.set(0x75, new Opcode(0x75, "PUSH22"))
opcodes.set(0x76, new Opcode(0x76, "PUSH23"))
opcodes.set(0x77, new Opcode(0x77, "PUSH24"))
opcodes.set(0x78, new Opcode(0x78, "PUSH25"))
opcodes.set(0x79, new Opcode(0x79, "PUSH26"))
opcodes.set(0x7a, new Opcode(0x7a, "PUSH27"))
opcodes.set(0x7b, new Opcode(0x7b, "PUSH28"))
opcodes.set(0x7c, new Opcode(0x7c, "PUSH29"))
opcodes.set(0x7d, new Opcode(0x7d, "PUSH30"))
opcodes.set(0x7e, new Opcode(0x7e, "PUSH31"))
opcodes.set(0x7f, new Opcode(0x7f, "PUSH32"))

opcodes.set(0x80, new Opcode(0x80, "DUP1"))
opcodes.set(0x81, new Opcode(0x81, "DUP2"))
opcodes.set(0x82, new Opcode(0x82, "DUP3"))
opcodes.set(0x83, new Opcode(0x83, "DUP4"))
opcodes.set(0x84, new Opcode(0x84, "DUP5"))
opcodes.set(0x85, new Opcode(0x85, "DUP6"))
opcodes.set(0x86, new Opcode(0x86, "DUP7"))
opcodes.set(0x87, new Opcode(0x87, "DUP8"))
opcodes.set(0x88, new Opcode(0x88, "DUP9"))
opcodes.set(0x89, new Opcode(0x89, "DUP10"))
opcodes.set(0x8a, new Opcode(0x8a, "DUP11"))
opcodes.set(0x8b, new Opcode(0x8b, "DUP12"))
opcodes.set(0x8c, new Opcode(0x8c, "DUP13"))
opcodes.set(0x8d, new Opcode(0x8d, "DUP14"))
opcodes.set(0x8e, new Opcode(0x8e, "DUP15"))
opcodes.set(0x8f, new Opcode(0x8f, "DUP16"))

opcodes.set(0x80, new Opcode(0x80, "DUP1"))
opcodes.set(0x81, new Opcode(0x81, "DUP2"))
opcodes.set(0x82, new Opcode(0x82, "DUP3"))
opcodes.set(0x83, new Opcode(0x83, "DUP4"))
opcodes.set(0x84, new Opcode(0x84, "DUP5"))
opcodes.set(0x85, new Opcode(0x85, "DUP6"))
opcodes.set(0x86, new Opcode(0x86, "DUP7"))
opcodes.set(0x87, new Opcode(0x87, "DUP8"))
opcodes.set(0x88, new Opcode(0x88, "DUP9"))
opcodes.set(0x89, new Opcode(0x89, "DUP10"))
opcodes.set(0x8a, new Opcode(0x8a, "DUP11"))
opcodes.set(0x8b, new Opcode(0x8b, "DUP12"))
opcodes.set(0x8c, new Opcode(0x8c, "DUP13"))
opcodes.set(0x8d, new Opcode(0x8d, "DUP14"))
opcodes.set(0x8e, new Opcode(0x8e, "DUP15"))
opcodes.set(0x8f, new Opcode(0x8f, "DUP16"))

opcodes.set(0x90, new Opcode(0x90, "SWAP1"))
opcodes.set(0x91, new Opcode(0x91, "SWAP2"))
opcodes.set(0x92, new Opcode(0x92, "SWAP3"))
opcodes.set(0x93, new Opcode(0x93, "SWAP4"))
opcodes.set(0x94, new Opcode(0x94, "SWAP5"))
opcodes.set(0x95, new Opcode(0x95, "SWAP6"))
opcodes.set(0x96, new Opcode(0x96, "SWAP7"))
opcodes.set(0x97, new Opcode(0x97, "SWAP8"))
opcodes.set(0x98, new Opcode(0x98, "SWAP9"))
opcodes.set(0x99, new Opcode(0x99, "SWAP10"))
opcodes.set(0x9a, new Opcode(0x9a, "SWAP11"))
opcodes.set(0x9b, new Opcode(0x9b, "SWAP12"))
opcodes.set(0x9c, new Opcode(0x9c, "SWAP13"))
opcodes.set(0x9d, new Opcode(0x9d, "SWAP14"))
opcodes.set(0x9e, new Opcode(0x9e, "SWAP15"))
opcodes.set(0x9f, new Opcode(0x9f, "SWAP16"))

opcodes.set(0xa0, new Opcode(0xa0, "LOG0"))
opcodes.set(0xa1, new Opcode(0xa1, "LOG1"))
opcodes.set(0xa2, new Opcode(0xa2, "LOG2"))
opcodes.set(0xa3, new Opcode(0xa3, "LOG3"))
opcodes.set(0xa4, new Opcode(0xa4, "LOG4"))

// https://github.com/vitelabs/go-vite/blob/master/vm/opcodes.go#L191
// 0xf0 range - closures.
opcodes.set(0xf0, new Opcode(0xf0, "CREATE"))
opcodes.set(0xf1, new Opcode(0xf1, "CALL"))
opcodes.set(0xf2, new Opcode(0xf2, "CALL2"))
opcodes.set(0xf3, new Opcode(0xf3, "RETURN"))
opcodes.set(0xf4, new Opcode(0xf4, "DELEGATECALL"))

opcodes.set(0xfa, new Opcode(0xfa, "STATICCALL"))
opcodes.set(0xfd, new Opcode(0xfd, "REVERT"))
opcodes.set(0xfe, new Opcode(0xfe, "INVALID"))
opcodes.set(0xff, new Opcode(0xff, "SELFDESTRUCT"))

for(const opcode of opcodes.values()){
    opcodes.set(opcode.name, opcode)
}