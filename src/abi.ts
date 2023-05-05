/* eslint-disable @typescript-eslint/no-unused-vars */
import blake from "blakejs"
import { AddressType, copyBigIntToBuffer, isValidAddress, isValidTokenId, _Buffer as Buffer } from "./utils"

export type byteSizes = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "25" | "26" | "27" | "28" | "29" | "30" | "31" | "32"
export type numberTypes = "8" | "16" | "24" | "32" | "40" | "48" | "56" | "64" | "72" | "80" | "88" | "96" | "104" | "112" | "120" | "128" | "136" | "144" | "152" | "160" | "168" | "176" | "184" | "192" | "200" | "208" | "216" | "224" | "232" | "240" | "248" | "256"
export type uintTypes = `uint${numberTypes}`
export type intTypes = `int${numberTypes}`
export type byteTypes = `bytes${byteSizes}`
export type ABIPrimitiveType = uintTypes | intTypes | byteTypes | "tokenId" | "address" | "boolean" | "null" | "bytes" | "string"
export type ABIType = ABIPrimitiveType | `${ABIPrimitiveType}[]` | `${ABIPrimitiveType}[${number}]`
export type ABIParam<type extends ABIType> = {
    name: string,
    type: type
}
export type ABIDynamicArrayDataType<primitive extends ABIPrimitiveType> = {
    [key in `${primitive}[]`]: ABIDataType[primitive][]
}
export type ABIFixedArrayDataType<primitive extends ABIPrimitiveType, size extends number> = {
    [key in `${primitive}[${size}]`]: ABIDataType[primitive][]
}
export type ABIDataType = Record<uintTypes, string> &
    Record<intTypes, string> &
    Record<byteTypes, Buffer> &
    {
        tokenId: string,
        address: string,
        boolean: boolean,
        null: null,
        bytes: Buffer,
        string: string,
    } &
    ABIDynamicArrayDataType<ABIPrimitiveType> &
    ABIFixedArrayDataType<ABIPrimitiveType, number>

export const decoders = new Map<ABIType, ABIDecoder<ABIDataType[ABIType]>>()
export const encoders = new Map<ABIType, ABIEncoder<ABIDataType[ABIType]>>()

// (u)ints
const TWO_POW_256 = 2n**256n
for(let i = 1; i <= 32; i++){
    decoders.set(`uint${i*8+"" as numberTypes}`, new class uintDecoder implements ABIDecoder<string> {
        decode(raw:Buffer):[string, Buffer]{
            const data = raw.slice(0, 32)
            if(data.length !== 32)throw new Error(`Buffer to short to decode uint${i*8}`)

            const number = BigInt(`0x${data.toString("hex")}`)
            return [number.toString(), raw.slice(32)]
        }
    })
    const MAX_UINT = 2n**(BigInt(i)*8n)-1n
    encoders.set(`uint${i*8+"" as numberTypes}`, new class uintEncoder implements ABIEncoder<string> {
        encode(raw:string):Buffer{
            const number = BigInt(raw)
            if(number > MAX_UINT || number < MAX_UINT)throw new Error(`Number out of range: [-${MAX_UINT};+${MAX_UINT}]`)

            const buffer = Buffer.alloc(32)
            copyBigIntToBuffer(number, buffer)

            return buffer
        }
    })
    const MAX_INT = 2n**(BigInt(i)*8n-1n)-1n
    decoders.set(`int${i*8+"" as numberTypes}`, new class intDecoder implements ABIDecoder<string> {
        decode(raw:Buffer):[string, Buffer]{
            const data = raw.slice(0, 32)
            if(data.length !== 32)throw new Error(`Buffer to short to decode int${i*8}`)

            let number = BigInt(`0x${data.toString("hex")}`)
            if(number > MAX_INT){
                number -= TWO_POW_256
            }
            return [number.toString(), raw.slice(32)]
        }
    })
    encoders.set(`int${i*8+"" as numberTypes}`, new class uintEncoder implements ABIEncoder<string> {
        encode(raw:string):Buffer{
            let number = BigInt(raw)
            if(number > MAX_INT || number < -MAX_INT)throw new Error(`Number out of range: [-${MAX_INT};+${MAX_INT}]`)
            if(number < 0){
                number = TWO_POW_256 + number
            }

            const buffer = Buffer.alloc(32)
            copyBigIntToBuffer(number, buffer)

            return buffer
        }
    })

    encoders.set(`bytes${i+"" as byteSizes}`, new class bytesEncoder implements ABIEncoder<Buffer> {
        encode(raw:Buffer):Buffer{
            if(raw.length !== i)throw new Error(`Invalid buffer size for bytes${i}`)

            const buffer = Buffer.alloc(32)
            raw.copy(buffer, 32-i)
            return 
        }
    })
    decoders.set(`bytes${i+"" as byteSizes}`, new class bytesDecoder implements ABIDecoder<Buffer> {
        decode(raw: Buffer): [data: Buffer, leftover: Buffer] {
            const data = raw.slice(0, 32)
            if(data.length !== 32)throw new Error(`Buffer to short to decode bytes${i}`)

            if(!Buffer.alloc(0, i).equals(data.slice(0, i)))throw new Error(`bytes${i} padding is not zero`)

            return [data.slice(32-i), raw.slice(32)]
        }
    })
}

// tokenId
const tokenIdPadding = Buffer.alloc(22)
decoders.set("tokenId", new class tokenIdDecoder implements ABIDecoder<string> {
    decode(raw: Buffer): [data: any, leftover: Buffer] {
        const data = raw.slice(0, 32)
        if(data.length !== 32)throw new Error(`Buffer to short to decode tokenId`)

        const padding = data.slice(0, 22)
        if(!padding.equals(tokenIdPadding))throw new Error(`data does not have tokenId padding`)
        
        const originalToken = data.slice(22)
        const checksum = blake.blake2b(originalToken, null, 2)
        return [`tti_${
            originalToken.toString("hex")
        }${
            Buffer.from(checksum).toString("hex")
        }`, raw.slice(32)]
    }
})
encoders.set("tokenId", new class tokenIdEncoder implements ABIEncoder<string> {
    encode(data: string): Buffer {
        if(!isValidTokenId(data))throw new Error(`Invalid token id`)
        
        const originalToken = Buffer.from(data.slice(4, -4), "hex")
        const buffer = Buffer.alloc(32)
        originalToken.copy(buffer, 22)

        return buffer
    }
})

// address
const addressPadding = Buffer.alloc(11)
decoders.set("address", new class addressDecoder implements ABIDecoder<string> {
    decode(raw: Buffer): [data: any, leftover: Buffer] {
        const data = raw.slice(0, 32)
        if(data.length !== 32)throw new Error(`Buffer to short to decode address`)

        const padding = data.slice(0, 11)
        if(!padding.equals(addressPadding))throw new Error(`data does not have address padding`)
        
        if(data[31] > 1)throw new Error(`isContract byte is invalid`)

        const originalAddress = data.slice(11, -1)
        const checksum = blake.blake2b(originalAddress, null, 5)
        if(data[31] === 0x01){
            for(let i = 0; i < checksum.length; i++){
                checksum[i] ^= 0xff
            }
        }
        return [`vite_${
            originalAddress.toString("hex")
        }${
            Buffer.from(checksum).toString("hex")
        }`, raw.slice(32)]
    }
})
encoders.set("address", new class addressEncoder implements ABIEncoder<string> {
    encode(data: string): Buffer {
        const addressType = isValidAddress(data)
        if(!addressType)throw new Error(`Invalid address`)
        
        const originalAddress = Buffer.from(data.slice(5, -10), "hex")
        const buffer = Buffer.alloc(32)
        originalAddress.copy(buffer, 11)
        if(addressType === AddressType.Contract){
            buffer[31] = 0x01
        }

        return buffer
    }
})

// boolean
decoders.set("boolean", new class booleanDecoder implements ABIDecoder<boolean> {
    decode(raw: Buffer): [data: boolean, leftover: Buffer] {
        const data = raw.slice(0, 32)
        if(data.length !== 32)throw new Error(`Buffer to short to decode boolean`)

        const zeros = Buffer.alloc(32)
        return [!zeros.equals(data), raw.slice(32)]
    }
})
encoders.set("boolean", new class booleanEncoder implements ABIEncoder<boolean> {
    encode(data: boolean): Buffer {
        const buffer = Buffer.alloc(32)
        if(data){
            buffer[31] = 0x01
        }

        return buffer
    }
})

// null
decoders.set("null", new class nullDecoder implements ABIDecoder<null> {
    decode(raw: Buffer): [data: null, leftover: Buffer] {
        const data = raw.slice(0, 32)
        if(data.length !== 32)throw new Error(`Buffer to short to decode null`)

        const zeros = Buffer.alloc(32)
        if(!data.equals(zeros))throw new Error(`Data is not null`)

        return [null, raw.slice(32)]
    }
})
encoders.set("null", new class booleanEncoder implements ABIEncoder<null> {
    encode(data: null): Buffer {
        if(data !== null)throw new Error(`Data is not null`)

        return Buffer.alloc(32)
    }
})

// null
decoders.set("null", new class nullDecoder implements ABIDecoder<null> {
    decode(raw: Buffer): [data: null, leftover: Buffer] {
        const data = raw.slice(0, 32)
        if(data.length !== 32)throw new Error(`Buffer to short to decode null`)

        const zeros = Buffer.alloc(32)
        if(!data.equals(zeros))throw new Error(`Data is not null`)

        return [null, raw.slice(32)]
    }
})
encoders.set("null", new class nullEncoder implements ABIEncoder<null> {
    encode(data: null): Buffer {
        if(data !== null)throw new Error(`Data is not null`)

        return Buffer.alloc(32)
    }
})

// bytes
decoders.set("bytes", new class bytesDecoder implements ABIDecoder<Buffer> {
    decode(raw: Buffer): [data: Buffer, leftover: Buffer] {
        const bufferCountBuffer = raw.slice(0, 32)
        if(bufferCountBuffer.length !== 32)throw new Error(`Buffer to short to decode bytes`)

        const count = BigInt(`0x${bufferCountBuffer.toString("hex")}`)
        if(count % 32n !== 0n)throw new Error(`Invalid bytes count`)
        if(count === 0n)return [Buffer.alloc(0), raw.slice(32)]

        const dataBuffer = raw.slice(32, 64+Number(count))
        if(BigInt(dataBuffer.length) !== count+32n)throw new Error(`Buffer to short to decode bytes`)
        
        const sizeBuffer = dataBuffer.slice(0, 32)
        const size = BigInt(`0x${sizeBuffer.toString("hex")}`)
        
        const data = dataBuffer.slice(32, 32+Number(size))
        if(BigInt(data.length) !== size)throw new Error(`Buffer to short to decode bytes`)


        return [data, raw.slice(64+Number(count))]
    }
})
encoders.set("bytes", new class bytesEncoder implements ABIEncoder<Buffer> {
    encode(data: Buffer): Buffer {
        let count = 0n

        const bufferSize = BigInt(data.length)
        count += bufferSize / 32n * 32n

        if(bufferSize % 32n !== 0n){
            count += 32n
        }

        const countBuffer = Buffer.alloc(32)
        const sizeBuffer = Buffer.alloc(32)
        const dataBuffer = Buffer.alloc(Number(count))
        copyBigIntToBuffer(count, countBuffer)
        copyBigIntToBuffer(bufferSize, sizeBuffer)
        data.copy(dataBuffer, 0)
        
        return Buffer.concat([
            countBuffer,
            sizeBuffer,
            dataBuffer
        ])
    }
})

// string
decoders.set("string", new class stringDecoder implements ABIDecoder<string> {
    decode(raw: Buffer): [data: string, leftover: Buffer] {
        const lengthBuffer = raw.slice(0, 32)
        if(lengthBuffer.length !== 32)throw new Error(`Buffer to short to decode bytes`)
        const length = BigInt(`0x${lengthBuffer.toString("hex")}`)

        let dataSize = length
        if(dataSize % 32n !== 0n){
            dataSize += 32n - dataSize % 32n
        }

        const data = raw.slice(32, 32+Number(dataSize))
        if(BigInt(data.length) !== dataSize)throw new Error(`Buffer to short to decode bytes`)

        return [
            data.slice(0, Number(length)).toString("utf8"),
            raw.slice(32+Number(dataSize))
        ]
    }
})
encoders.set("string", new class stringEncoder implements ABIEncoder<string> {
    encode(data: string): Buffer {
        const dataBuff = Buffer.from(data, "utf8")
        let dataSize = dataBuff.length
        if(dataSize % 32 !== 0){
            dataSize += 32 - dataSize % 32
        }

        const dataBuffer = Buffer.alloc(dataSize)
        dataBuff.copy(dataBuffer, 0)
        const sizeBuffer = Buffer.alloc(32)
        copyBigIntToBuffer(BigInt(dataBuff.length), sizeBuffer)

        return Buffer.concat([
            sizeBuffer,
            dataBuffer
        ])
    }
})

export function decodeArgument<type extends ABIType>(arg: Buffer, abi: ABIParam<type>):ABIDataType[type]{
    const decoder = decoders.get(abi.type)
    const [result, leftover] = decoder.decode(arg)
    if(leftover.length !== 0)throw new Error(`Invalid argument; does not match data type ${abi.type}`)

    return result as ABIDataType[type]
}
export function encodeArgument<type extends ABIType>(arg: ABIDataType[type], abi: ABIParam<type>):Buffer{
    const encoder = encoders.get(abi.type)
    const result = encoder.encode(arg)

    return result
}

export class ABIEncoder<type extends ABIDataType[ABIType]> {
    encode(data:type):Buffer{
        throw new Error(`Not Implemented`)
    }
}
export class ABIDecoder<type extends ABIDataType[ABIType]> {
    decode(data:Buffer):[data:type, leftover:Buffer]{
        throw new Error(`Not Implemented`)
    }
}