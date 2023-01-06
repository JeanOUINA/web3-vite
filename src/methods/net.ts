import { NodeInfo, SyncDetail, SyncInfo } from "../types"
import { Client } from "../client"

export class NetMethodsManager {
    private client: Client

    constructor(client:Client){
        this.client = client
    }

    syncInfo(){
        return this.client.request<SyncInfo>("net_syncInfo")
    }

    syncDetail(){
        return this.client.request<SyncDetail>("net_syncDetail")
    }

    nodeInfo(){
        return this.client.request<NodeInfo>("net_nodeInfo")
    }
}