import { AccountBlockV2, AccountInfo, GetPoWDifficultyResult, SnapshotBlock, VmLog } from "../types"
import { Client, ClientFlags } from "../client"
import { _Buffer as Buffer } from "../utils"

export class LedgerMethodsManager {
    private client: Client

    constructor(client:Client){
        this.client = client
    }

    getAccountBlocks(address:string, hash:string = null, token:string = null, count:number){
        return this.client.request<AccountBlockV2[]>("ledger_getAccountBlocks", [
            address,
            hash || null,
            token || null,
            count
        ])
    }

    getAccountBlockByHash(hash:string){
        return this.client.request<AccountBlockV2>("ledger_getAccountBlockByHash", [
            hash
        ])
    }

    getAccountBlockByHeight(address:string, height:number){
        return this.client.request<AccountBlockV2>("ledger_getAccountBlockByHeight", [
            address,
            height
        ])
    }

    getAccountBlocksByAddress(address:string, pageIndex:number, pageSize:number){
        return this.client.request<AccountBlockV2[]>("ledger_getAccountBlocksByAddress", [
            address,
            pageIndex,
            pageSize
        ])
    }

    getLatestAccountBlock(address:string){
        return this.client.request<AccountBlockV2>("ledger_getLatestAccountBlock", [
            address
        ])
    }

    async getSnapshotChainHeight(){
        const height = await this.client.request<string>("ledger_getSnapshotChainHeight")
        return parseInt(height)
    }

    getSnapshotBlockByHash(hash:string){
        return this.client.request<SnapshotBlock>("ledger_getSnapshotBlockByHash", [
            hash
        ])
    }

    getSnapshotBlockByHeight(height:number){
        return this.client.request<SnapshotBlock>("ledger_getSnapshotBlockByHeight", [
            height
        ])
    }

    getChunks(startHeight: number, endHeight: number){
        return this.client.request<{
            accountBlocks?: AccountBlockV2[],
            snapshotBlock?: SnapshotBlock   
        }[]>("ledger_getChunksV2", [
            startHeight,
            endHeight
        ])
    }

    getAccountInfoByAddress(address: string){
        return this.client.request<AccountInfo>("ledger_getAccountInfoByAddress", [
            address
        ])
    }

    getLatestSnapshotHash(){
        return this.client.request<string>("ledger_getLatestSnapshotHash")
    }

    sendRawTransaction(block: Partial<AccountBlockV2>){
        return this.client.request<null>("ledger_sendRawTransaction", [
            block
        ])
    }

    getUnreceivedBlocksByAddress(address:string, pageIndex:number, pageSize:number){
        return this.client.request<AccountBlockV2[]>("ledger_getUnreceivedBlocksByAddress", [
            address,
            pageIndex,
            pageSize
        ])
    }

    getUnreceivedBlocksInBatch(query:{
        address: string,
        pageNumber: number,
        pageCount: number
    }[]){
        return this.client.request<{
            [address:string]: AccountBlockV2[]
        }>("ledger_getUnreceivedBlocksInBatch", [
            query
        ])
    }

    getUnreceivedTransactionSummaryByAddress(address:string){
        return this.client.request<AccountInfo>("ledger_getUnreceivedTransactionSummaryByAddress", [
            address
        ])
    }

    getUnreceivedTransactionSummaryInBatch(addresses: string[]){
        return this.client.request<AccountInfo>("ledger_getUnreceivedTransactionSummaryInBatch", [
            addresses
        ])
    }

    getVmLogs(hash: string){
        return this.client.request<VmLog[]>("ledger_getVmLogs", [
            hash
        ])
    }

    getVmLogsByFilter(filter: {
        [address: string]: {
            startHeight: number,
            endHeight: number
        }
    }, topics:string[][] = []){
        const params = {}
        for(const address in filter){
            params[address] = {
                fromHeight: String(filter[address].startHeight),
                toHeight: String(filter[address].endHeight)
            }
        }
        return this.client.request<{
            accountBlockHash: string,
            accountBlockHeight: string,
            address: string,
            vmlog: VmLog,
            removed: boolean
        }[]>("ledger_getVmLogsByFilter", [
            {
                addressHeightRange: params,
                topics: topics
            }
        ])
    }

    getPoWDifficulty(data:{
        address: string,
        previousHash: string,
        blockType: number,
        toAddress: string,
        data?: string
    }){
        if(!data.data)data.data = ""
        return this.client.request<GetPoWDifficultyResult>("ledger_getPoWDifficulty", [
            data
        ])
    }

    getConfirmedBalances(snapshotHash: string, addresses: string[], tokenIds: string[]){
        return this.client.request<{
            [address: string]: {
                [tokenId: string]: number
            }
        }>("ledger_getConfirmedBalances", [
            snapshotHash,
            addresses,
            tokenIds
        ])
    }

    async getContractResponse(hash: string):Promise<Buffer>{
        if(!this.client.flags.has(ClientFlags.ContractResults)){
            throw new Error("Contract results are not enabled on the server")
        }

        const result = await this.client.request<string>("ledger_getContractResponse", [
            hash
        ])
        if(!result)return Buffer.alloc(0)
        return Buffer.from(result, "base64")
    }
}