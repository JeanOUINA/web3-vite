import BigNumber from "bignumber.js"
import { numberTypes } from "./abi"
import { ClientFlags } from "./client"

export const viteTokenId = "tti_5649544520544f4b454e6e40"
export const usdtTokenId = "tti_80f3751485e4e83456059473"
export const btcTokenId = "tti_b90c9baffffc9dae58d1f33f"
export const ethTokenId = "tti_687d8a93915393b219212c73"

export const maxUintsBigInt:{
    [key in `uint${numberTypes}`|numberTypes]: bigint
} = new Proxy({}, {
    get: function (target, name) {
        name = String(name).replace("uint", "")
        if(name in target)return target[name]
        
        const exp = BigInt(name)
        if(exp > 256n)return undefined
        if(exp % 8n !== 0n)return undefined

        const result = 2n**exp-1n
        target[name] = result
        return result
    }
}) as any
export const maxUints:{
    [key in `uint${numberTypes}`|numberTypes]: BigNumber
} = new Proxy({}, {
    get: function (target, name) {
        name = String(name).replace("uint", "")
        if(name in target)return target[name]
    
        const bigint = maxUintsBigInt[name]
        if(!bigint)return undefined
        const result = new BigNumber(bigint.toString())
        target[name] = result
        return result
    }
}) as any


export const uintsBigInt:{
    [key in `uint${numberTypes}`|numberTypes]: bigint
} = new Proxy({}, {
    get: function (target, name) {
        name = String(name).replace("uint", "")
        if(name in target)return target[name]

        const bigint = maxUintsBigInt[name]
        if(!bigint)return undefined
        target[name] = bigint+1n
        return bigint+1n
    }
}) as any
export const uints:{
    [key in `uint${numberTypes}`|numberTypes]: BigNumber
} = new Proxy({}, {
    get: function (target, name) {
        name = String(name).replace("uint", "")
        if(name in target)return target[name]
    
        const bigint = uintsBigInt[name]
        if(!bigint)return undefined
        const result = new BigNumber(bigint.toString())
        target[name] = result
        return result
    }
}) as any

export const nodes = {
    mainnet: {
        Thomiz: {
            http: "https://node-vite.thomiz.dev",
            ws: "wss://node-vite.thomiz.dev/ws",
            flags: new Set([
                ClientFlags.ContractResults,
                ClientFlags.Heartbeat,
                ClientFlags.VPoW
            ])
        },
        iMalfect: {
            http: "https://node-vite.imal.dev",
            ws: "wss://node-vite.imal.dev/ws"
        },
        ViteLabs: {
            http: "https://node.vite.net/gvite",
            ws: "wss://node.vite.net/gvite/ws",
        },
        ViteLabsTokyo: {
            http: "https://node-tokyo.vite.net/gvite",
            ws: "wss://node-tokyo.vite.net/gvite/ws",
        }
    },
    testnet: {
        ViteLabs: {
            http: "https://buidl.vite.net/gvite",
            ws: "wss://buidl.vite.net/gvite/ws",
        }
    },
    debug: {
        localhost: {
            http: "http://localhost:23456",
            ws: "ws://localhost:23457/",
        }
    }
}