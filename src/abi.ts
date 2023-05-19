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
