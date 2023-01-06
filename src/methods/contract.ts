import { Client } from "../client"
import { createContractAddress, _Buffer as Buffer } from "../utils"
import { ContractInfo, QuotaInfo, RewardByDayInfo, RewardInfo, SBPInfo, SBPVoteDetail, SBPVoteInfo, StakeInfo, StakeListInfo, TokenInfo, TokenListInfo, VoteInfo } from "../types"

export class ContractMethodsManager {
    private client: Client

    constructor(client:Client){
        this.client = client
    }

    async createContractAddress(sender: string, height: string, prevHash: string){
        // compute locally to avoid querying the node because way faster
        return createContractAddress(
            sender,
            height,
            prevHash
        )
    }

    async getContractInfo(address: string){
        const contractInfo = await this.client.request<ContractInfo>("contract_getContractInfo", [
            address
        ])
        contractInfo.code = Buffer.from(contractInfo.code, "base64").toString("hex")
        return contractInfo
    }

    async callOffChainMethod(address: string, code: string, data: string, accountHeight?: string, snapshotHash?: string):Promise<string>{
        // Try to convert to base64 if we can
        if(/^[abcdef\d]+$/.test(data)){
            data = Buffer.from(data, "hex").toString("base64")
        }
        if(/^[abcdef\d]+$/.test(code)){
            code = Buffer.from(code, "hex").toString("base64")
        }
        const params = {
            address: address,
            code: code,
            data: data,
            snapshotHash: null,
            height: null
        }
        if(snapshotHash){
            if(/^[abcdef\d]{64}$/.test(snapshotHash)){
                params.snapshotHash = snapshotHash
            }else throw new Error("Invalid Snapshot Hash")
        }
        if(accountHeight){
            if(/^\d+$/.test(accountHeight)){
                params.height = accountHeight
            }else throw new Error("Invalid Account Height")
        }
        return this.client.request<string>("contract_callOffChainMethod", [
            params
        ]).then(data => {
            if(data)return Buffer.from(data, "base64").toString("hex")
            return data
        })
    }

    async query(address: string, data: string, accountHeight?: string, snapshotHash?: string){
        // Try to convert to base64 if we can
        if(/^[abcdef\d]+$/.test(data)){
            data = Buffer.from(data, "hex").toString("base64")
        }
        const params = {
            address: address,
            data: data,
            snapshotHash: null,
            height: null
        }
        if(snapshotHash){
            if(/^[abcdef\d]{64}$/.test(snapshotHash)){
                params.snapshotHash = snapshotHash
            }else throw new Error("Invalid Snapshot Hash")
        }
        if(accountHeight){
            if(/^\d+$/.test(accountHeight)){
                params.height = accountHeight
            }else throw new Error("Invalid Account Height")
        }
        return this.client.request<string>("contract_query", [
            params
        ]).then(data => {
            if(data)return Buffer.from(data, "base64").toString("hex")
            return data
        })
    }

    async getContractStorage(address: string, position: string){
        return this.client.request<{
            [position:string]:string
        }>("contract_getContractStorage", [
            address,
            position
        ])
    }

    async getQuotaByAccount(address: string){
        return this.client.request<QuotaInfo>("contract_getQuotaByAccount", [
            address
        ])
    }

    async getStakeList(address: string, pageIndex: number, pageSize: number){
        return this.client.request<StakeListInfo>("contract_getStakeList", [
            address,
            pageIndex,
            pageSize
        ])
    }

    async getRequiredStakeAmount(quotaPerSecond: string){
        return this.client.request<string>("contract_getRequiredStakeAmount", [
            quotaPerSecond
        ])
    }

    async getDelegatedStakeInfo(stakeAddress: string, delegateAddress: string, beneficiary: string, bid: number){
        return this.client.request<StakeInfo>("contract_getDelegatedStakeInfo", [
            stakeAddress,
            delegateAddress,
            beneficiary,
            bid
        ])
    }

    async getSBPList(address: string){
        return this.client.request<SBPInfo>("contract_getSBPList", [
            address
        ])
    }

    async getSBPRewardPendingWithdrawal(sbpName: string){
        return this.client.request<RewardInfo>("contract_getSBPRewardPendingWithdrawal", [
            sbpName
        ])
    }

    async getSBPRewardsByTimestamp(timestamp: number){
        return this.client.request<RewardByDayInfo>("contract_getSBPRewardByTimestamp", [
            timestamp
        ])
    }
    
    async getSBPRewardsByCycle(cycle: string){
        return this.client.request<RewardByDayInfo>("contract_getSBPRewardByCycle", [
            cycle
        ])
    }

    async getSBP(sbpName: string){
        return this.client.request<SBPInfo>("contract_getSBP", [
            sbpName
        ])
    }

    async getSBPVoteList(){
        return this.client.request<SBPVoteInfo[]>("contract_getSBPVoteList")
    }

    async getVotedSBP(address: string){
        return this.client.request<VoteInfo>("contract_getVotedSBP", [
            address
        ])
    }

    async getSBPVoteDetailsByCycle(cycle: string){
        return this.client.request<SBPVoteDetail[]>("contract_getSBPVoteDetailsByCycle", [
            cycle
        ])
    }

    async getTokenList(pageIndex: number, pageSize: number){
        return this.client.request<TokenListInfo>("contract_getTokenInfoList", [
            pageIndex,
            pageSize
        ])
    }

    async getTokenInfo(tokenId: string){
        return this.client.request<TokenInfo>("contract_getTokenInfoById", [
            tokenId
        ])
    }
    
    async getTokenListByOwner(address: string){
        return this.client.request<TokenInfo[]>("contract_getTokenInfoById", [
            address
        ])
    }
}