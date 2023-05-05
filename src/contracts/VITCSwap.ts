import BigNumber from "bignumber.js";
import { TokenInfo } from "../types";
import { viteTokenId } from "../constants";
import { Client } from "../client"
import { Contract, ABI } from "../contract"
import { isValidTokenId } from "../utils"

export type VITCSwapVersion = "v1"|"v2"
export const addresses = new Map<VITCSwapVersion, string>([
    ["v1", "vite_29ae0b9f951323b3bfe9bb8251bba2830eddacf51631630495"],
])
export const abis = new Map<VITCSwapVersion, ABI>([
    ["v1", [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"addr","type":"address"},{"indexed":true,"internalType":"tokenId","name":"token","type":"tokenId"},{"indexed":false,"internalType":"uint256","name":"tokenAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"viteAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"tokenTotal","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"viteTotal","type":"uint256"}],"name":"AddLiquidity","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"addr","type":"address"}],"name":"DAOAddressChange","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"NewOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"tokenId","name":"token","type":"tokenId"}],"name":"NewPair","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"string","name":"sbpName","type":"string"}],"name":"NewVote","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"PairCreationFeeChange","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"addr","type":"address"},{"indexed":true,"internalType":"tokenId","name":"token","type":"tokenId"},{"indexed":false,"internalType":"uint256","name":"tokenAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"viteAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"tokenTotal","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"viteTotal","type":"uint256"}],"name":"RemoveLiquidity","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_address","type":"address"},{"indexed":true,"internalType":"tokenId","name":"fromToken","type":"tokenId"},{"indexed":true,"internalType":"tokenId","name":"toToken","type":"tokenId"},{"indexed":false,"internalType":"uint256","name":"fromAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"toAmount","type":"uint256"}],"name":"Swap","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"lpfee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"daofee","type":"uint256"}],"name":"SwapFeeChange","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_address","type":"address"},{"indexed":true,"internalType":"tokenId","name":"fromToken","type":"tokenId"},{"indexed":true,"internalType":"tokenId","name":"toToken","type":"tokenId"},{"indexed":false,"internalType":"uint256","name":"fromAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"toAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"total","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"totalVITE","type":"uint256"}],"name":"SwapInternal","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"addr","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newBalance","type":"uint256"}],"name":"VITEDeposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"addr","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newBalance","type":"uint256"}],"name":"VITEWithdrawal","type":"event"},{"anonymous":false,"inputs":[],"name":"VoteCancel","type":"event"},{"inputs":[],"name":"DAO_ADDRESS","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"NULL_TOKEN","outputs":[{"internalType":"tokenId","name":"","type":"tokenId"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PAIR_CREATION_FEE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"UINT256_MAX","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"VITE_TOKEN","outputs":[{"internalType":"tokenId","name":"","type":"tokenId"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"sbpName","type":"string"}],"name":"VoteForSBP","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"addLiquidity","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"viteAmount","type":"uint256"}],"name":"addOriginalLiquidity","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"tokenId","name":"tokenId","type":"tokenId"},{"internalType":"bool","name":"isReIssuable","type":"bool"},{"internalType":"string","name":"tokenName","type":"string"},{"internalType":"string","name":"tokenSymbol","type":"string"},{"internalType":"uint256","name":"totalSupply","type":"uint256"},{"internalType":"uint256","name":"decimals","type":"uint256"}],"name":"cacheTokenInfo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"tokenId","name":"","type":"tokenId"}],"name":"cached_tokens","outputs":[{"internalType":"bool","name":"isReIssuable","type":"bool"},{"internalType":"string","name":"tokenName","type":"string"},{"internalType":"string","name":"tokenSymbol","type":"string"},{"internalType":"uint256","name":"totalSupply","type":"uint256"},{"internalType":"uint256","name":"decimals","type":"uint256"},{"internalType":"bool","name":"fetched","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"cancelVote","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"newFee","type":"uint256","value":"0"}],"name":"changePairCreationFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"lpFee","type":"uint256"},{"internalType":"uint256","name":"daoFee","type":"uint256"}],"name":"changeSwapFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"tokenId","name":"token","type":"tokenId"}],"name":"createNewPair","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"daofee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"depositVITE","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"tokenId","name":"from","type":"tokenId"},{"internalType":"tokenId","name":"to","type":"tokenId"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"getConversion","outputs":[{"internalType":"uint256","name":"returnAmount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"tokenId","name":"token","type":"tokenId"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"getCurrencyConversion","outputs":[{"internalType":"uint256","name":"returnAmount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"tokenId","name":"from","type":"tokenId"},{"internalType":"tokenId","name":"to","type":"tokenId"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"getInversedConversion","outputs":[{"internalType":"uint256","name":"returnAmount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"tokenId","name":"token","type":"tokenId"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"getInversedCurrencyConversion","outputs":[{"internalType":"uint256","name":"returnAmount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"tokenId","name":"token","type":"tokenId"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"getInversedVITEConversion","outputs":[{"internalType":"uint256","name":"returnAmount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"tokenId","name":"token","type":"tokenId"}],"name":"getLiquidity","outputs":[{"internalType":"uint256","name":"total","type":"uint256"},{"internalType":"uint256","name":"totalVITE","type":"uint256"},{"internalType":"uint256","name":"k","type":"uint256"},{"internalType":"uint256","name":"tknSupply","type":"uint256"},{"internalType":"tokenId","name":"lpToken","type":"tokenId"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"},{"internalType":"tokenId","name":"token","type":"tokenId"}],"name":"getLiquidityTokenBalance","outputs":[{"internalType":"uint256","name":"lpBalance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"ownerAddr","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"getVITEBalance","outputs":[{"internalType":"uint256","name":"userBalance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"tokenId","name":"token","type":"tokenId"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"getVITEConversion","outputs":[{"internalType":"uint256","name":"returnAmount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lpfee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"tokenId","name":"","type":"tokenId"}],"name":"pairs","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"tokenId","name":"token","type":"tokenId"},{"internalType":"uint256","name":"poolAmount","type":"uint256"}],"name":"removeLiquidity","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address payable","name":"newAddress","type":"address"}],"name":"setDAOAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"tokenId","name":"token","type":"tokenId"}],"name":"setLiquidityToken","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"setOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"recipient","type":"address"},{"internalType":"tokenId","name":"targetToken","type":"tokenId"},{"internalType":"uint256","name":"minimum","type":"uint256"}],"name":"swap","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"tokenId","name":"token","type":"tokenId"}],"name":"withdrawLiquidityToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawVITE","outputs":[],"stateMutability":"nonpayable","type":"function"}]],
])

export type Liquidity = {
    total: string
    totalVITE: string
    k: string
    tknSupply: string
    lpToken: string
}

export default class VITCSwap extends Contract {
    version:VITCSwapVersion
    constructor(client:Client, version:VITCSwapVersion = "v1"){
        super(client, addresses.get(version), abis.get(version))
        this.version = version
    }

    async getTokens():Promise<string[]>{
        switch(this.version){
            case "v1": {
                // lol timeout
                // v1 takes a shitton of time to get all the events
                // split the requests
                // somehow it's an optimization
                const infos = await this.client.methods.ledger.getAccountInfoByAddress(this.address)
                const blockCount = Number(infos.blockCount)
                const tokens:string[] = []
                const promises = []
                for(let i = 0; i * 20000 < blockCount; i++){
                    let e = i
                    promises.push(
                        new Promise(r=>setTimeout(r,e))
                        .then(() => this.events.NewPair.fetchLogs(e*20000 + 1, (e*20000 + 20001)))
                        .then(events => {
                            for(const event of events){
                                tokens.push(event.decoded.token)
                            }
                        })
                    )
                }
                await Promise.all(promises)
        
                return tokens
            }
            case "v2":
            default: {
                // cleaner and faster code for v2
                const result = await this.get("getPairs")
                return result.raw[0]
            }
        }
    }

    async isListed(token:string):Promise<boolean>{
        if(!isValidTokenId(token))throw new Error(`token is not a valid token id`)
        if(token === viteTokenId)return true

        const result = await this.get("pairs", [token])
        return result.raw[0]
    }

    async getLiquidity(token:string):Promise<Liquidity>{
        if(!isValidTokenId(token))throw new Error(`token is not a valid token id`)
        if(token === viteTokenId)throw new Error(`token cannot be vite`)

        const result = await this.get<Liquidity>("getLiquidity", [token])
        return {
            ...result.map,
            // v2 doesn't have k
            k: result.map.k ?? BigInt(result.map.total)*BigInt(result.map.totalVITE),
        } as Liquidity
    }

    async getTokenPrice(token:string, quote:string){
        if(!isValidTokenId(token))throw new Error(`token is not a valid token id`)
        if(!isValidTokenId(quote))throw new Error(`quote is not a valid token id`)
        if(token === quote)return new BigNumber(1)

        const existsPromise:Promise<any>[] = []
        for(const tkn of [token, quote]){
            existsPromise.push(
                this.isListed(tkn)
            )
        }
        const exists = await Promise.all(existsPromise)
        if(exists.find(isListed => !isListed))throw new Error(`token or quote isn't listed on VITCSwap`)

        const prices = [
            new BigNumber(1),
            new BigNumber(1)
        ]
        const tokens:TokenInfo[] = [null, null]
        let viteTokenInfo:TokenInfo
        // both of the tokens are listed (or one is vite)
        const liquidityPromise:Promise<any>[] = [
            this.client.methods.contract.getTokenInfo(viteTokenId)
            .then(tokenInfo => {
                viteTokenInfo = tokenInfo
            })
        ]
        for(let i = 0; i < 2; i++){
            const tkn = [token, quote][i]
            if(tkn !== viteTokenId){
                liquidityPromise.push(
                    this.client.methods.contract.getTokenInfo(tkn)
                    .then(tokenInfo => {
                        tokens[i] = tokenInfo
                    })
                )
                liquidityPromise.push(
                    this.getLiquidity(tkn)
                    .then(liquidity => {
                        // totalVite/total
                        const price = prices[i] = new BigNumber(
                            liquidity.totalVITE
                        ).div(
                            liquidity.total
                        )
                        if(price.isNaN()){
                            prices[i] = new BigNumber(0)
                        }
                        return liquidity
                    })
                )
            }
        }
        await Promise.all(liquidityPromise)

        if(prices.find(e => e.isZero()))return new BigNumber(0)

        for(let i = 0; i < 2; i++){
            const tkn = [token, quote][i]
            let decimals = tokens[i]?.decimals
            if(tkn === viteTokenId){
                decimals = viteTokenInfo.decimals
            }

            prices[i] = prices[i].shiftedBy(decimals-viteTokenInfo.decimals)
        }

        return prices[0].div(prices[1])
    }
}