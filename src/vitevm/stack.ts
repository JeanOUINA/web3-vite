import { uintsBigInt } from "../constants"
import { copyBigIntToBuffer, _Buffer as Buffer } from "../utils"
import { VmError } from "./vm"

export class Stack {
    private store: bigint[] = []
    private maxHeight = 1024
    constructor(maxHeight?: number) {
        this.maxHeight = maxHeight ?? 1024
    }

    get length() {
        return this.store.length
    }

    push(value: bigint) {
        if (typeof value !== "bigint") {
            throw new VmError("Stack only accepts bigint")
        }

        if (value >= uintsBigInt.uint256) {
            throw new VmError("Value out of range")
        }

        if (this.store.length >= this.maxHeight) {
            throw new VmError("stack maxHeight reached")
        }

        this.store.push(value)
    }

    pop() {
        if (!this.store.length) {
            throw new VmError("Stack is empty")
        }

        return this.store.pop()
    }

    popN(n = 1) {
        if (this.store.length < n) {
            throw new VmError(`Not enough element to popN`)
        }

        if (n === 0) {
            return []
        }

        return this.store.splice(-1 * n).reverse()
    }

    require(n:number){
        if(this.store.length < n){
            throw new VmError(`Not enough element to require`)
        }
    }

    dup(position: number) {
        if (this.store.length < position) {
            throw new VmError(`Not enough element to dup`)
        }

        const i = this.store.length - position
        this.push(this.store[i])
    }

    swap(position: number) {
        if (this.store.length <= position) {
            throw new VmError(`Not enough element to swap`)
        }

        const head = this.store.length - 1
        const i = this.store.length - position - 1

        const tmp = this.store[head]
        this.store[head] = this.store[i]
        this.store[i] = tmp
    }

    toString() {
        const storage:string[] = []
        for(const item of this.store){
            const buffer = Buffer.alloc(32)
            copyBigIntToBuffer(item, buffer)
            storage.push("0x"+buffer.toString("hex"))
        }
        return storage.join(", ")
    }
}