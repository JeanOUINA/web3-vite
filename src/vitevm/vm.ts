import { AccountBlockV2 } from "../types"
import { NumberLike } from "../utils"
import { Memory } from "./memory"
import { Stack } from "./stack"

export interface DataProvider {
    getBalance(address: string, tokenId: string): Promise<NumberLike>
}

export class VirtualMachine {
    stack: Stack
    memory: Memory
    block: Partial<AccountBlockV2>
    dataProvider: DataProvider
    offchain?: boolean
}

export class VmError extends Error {
    name = "VmError"
}