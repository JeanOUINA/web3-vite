import { EventEmitter } from "./events"
import { ProviderError, ViteError, ViteRequestError } from "./errors"
import { MethodManager } from "./methods"
import { HTTPProvider } from "./providers/http"
import { Provider } from "./providers/provider"
import { WebsocketProvider } from "./providers/ws"

export interface ClientOptions {
    flags?: Set<ClientFlags>
}
export enum ClientFlags {
    /** 
     * Enable VPoW API
     */
    VPoW = 0b0000_0001,
    /** 
     * Send Hearbeat for the connection
     * 
     * Using that with an incompatible server (gvite) might
     * result in a disconnection
     */
    Heartbeat = 0b0000_0010,
    /**
     * Contract Results
     * 
     * Enable the contract results API
     * Currently only supported by node-vite.thomiz.dev
     */
    ContractResults = 0b0000_0100,
}
export type ProviderType = "http" | "ws" | "ipc"
export class Client extends EventEmitter<{
    connect: [],
    close: []
}> {
    provider: Provider
    connected: boolean
    methods: MethodManager
    flags: Set<ClientFlags>

    constructor(url:string, options?: ClientOptions){
        super()
        const parsed = new URL(url)

        if(!options){
            // default options
            const isViteProxy = parsed.hostname == "node-vite.thomiz.dev"
            const isThomizNode = parsed.hostname == "node-vite.thomiz.dev"
            options = {
                flags: new Set([
                    isViteProxy && ClientFlags.Heartbeat,
                    isThomizNode && ClientFlags.ContractResults,
                    isThomizNode && ClientFlags.VPoW,
                ].filter(e => !!e))
            }
        }
        this.flags = options.flags || new Set()

        switch(parsed.protocol){
            case "ws:": 
            case "wss:": {
                const provider = this.provider = new WebsocketProvider(url, new Set(this.flags))
                provider.on("ready", () => {
                    this.registerSubscription()
                })
                break
            }
            case "http:":
            case "https:": {
                this.provider = new HTTPProvider(url)
                break
            }
            default: {
                throw new ProviderError("Invalid url scheme: "+JSON.stringify(parsed.protocol))
            }
        }

        this.methods = new MethodManager(this)
    }

    private nextTickProcessing: boolean = false
    private requests: {
        method: string,
        params: string[],
        resolve: (data: any) => void,
        reject: (err:Error) => void
    }[] = []

    async request<T=any>(methodName: string, params: any[] = []):Promise<T>{
        if(typeof methodName !== "string" || !methodName){
            throw new ViteRequestError("Invalid Method Name")
        }
        if(!Array.isArray(params)){
            throw new ViteRequestError("Invalid Params")
        }

        // This function is optimized for http provider
        // we basically queue until next tick (not a long time) before sending
        // to batch calls in a single one
        return new Promise<T>((resolve, reject) => {
            this.requests.push({
                method: methodName,
                params: params,
                resolve,
                reject
            })

            this.requestNextTick()
        })
    }

    private requestNextTick(){
        if(!this.nextTickProcessing){
            this.nextTickProcessing = true
            setImmediate(async () => {
                this.nextTickProcessing = false
                // in next tick
                const reqs = this.requests.slice(0, 300)
                if(!reqs.length)return

                this.requests = this.requests.slice(300)
                if(this.requests.length){
                    // means more requests to process
                    this.requestNextTick()
                }

                try{
                    const results = await this.provider.send(reqs.map(req => {
                        return {
                            method: req.method,
                            params: req.params
                        }
                    }))
    
                    let i = 0
                    for(const req of reqs){
                        const result = results[i]
    
                        if(result.error){
                            req.reject(new ViteError(result))
                        }else{
                            req.resolve(result.result)
                        }
    
                        i++
                    }
                }catch(err){
                    for(const req of reqs){
                        req.reject(err)
                    }
                }
            })
        }
    }

    private subscriptions:Subscription<SubscriptionName>[] = []
    private async registerSubscription(){
        const promises = []
        for(const subscription of this.subscriptions){
            promises.push(
                this.provider.subscribe(subscription.method, subscription.params)
                .then(events => {
                    subscription.events.emit("ready", events.id)
                    events.on("data", result => {
                        subscription.events.emit("data", result)
                    }).on("error", (error) => {
                        subscription.events.emit("error", error)
                    }).on("close", () => {
                        subscription.events.emit("unsubscribe")
                    })
                }).catch(error => {
                    subscription.events.emit("error", "error" in error ? new ViteError(error) : error)
                })
            )
        }
        return Promise.all(promises)
    }

    async subscribe<name extends SubscriptionName>(name:name, ...params:SubscriptionParams[name]):Promise<Subscription<name>>{
        if(name === "vmlog"){
            const result = {}
            const params1 = params[0] as unknown as SubscriptionParams["vmlog"]
            for(const address in params1){
                result[address] = {
                    fromHeight: String(params1[address].startHeight),
                    toHeight: String(params1[address].endHeight)
                }
            }
            params[0] = {
                addressHeightRange: result
            } as any
        }
        const subscription:Subscription<name> = {
            method: name,
            params: params,
            events: new EventEmitter() as SubscriptionEmitter,
            unsubscribe: ()=>{},
            id: null
        }
        await this.provider.subscribe(subscription.method, subscription.params)
        .then(events => {
            subscription.id = events.id
            setImmediate(() => {
                subscription.unsubscribe = events.unsubscribe
                subscription.events.emit("ready", events.id)
                events.on("data", result => {
                    subscription.events.emit("data", result)
                }).on("error", (error) => {
                    subscription.events.emit("error", error)
                }).on("close", () => {
                    subscription.events.emit("unsubscribe")
                })
            })
        }).catch((error) => {
            return Promise.reject("error" in error ? new ViteError(error) : error)
        })
        this.subscriptions.push(subscription)
        return subscription
    }
}

export type SubscriptionEmitter<resultType = any> = EventEmitter<{
    data: [data: resultType],
    error: [error: Error],
    ready: [subscriptionId: string],
    unsubscribe: []
}>
export type Subscription<name extends SubscriptionName> = {
    method: name,
    params: any[],
    events: SubscriptionEmitter<SubscriptionResultTypes[name]>,
    unsubscribe():void,
    id: string
}

export type SubscriptionParams = {
    snapshotBlock: [],
    accountBlock: [],
    accountBlockByAddress: [address:string],
    unreceivedBlockByAddress: [address:string],
    vmlog: [filterParam:{
        [address: string]: {
            startHeight: string,
            endHeight: string
        }
    }]
}

export type SubscriptionResultTypes = {
    snapshotBlock: {
        hash: string,
        height: string,
        removed: boolean
    },
    accountBlock: {
        hash: string,
        removed: boolean
    },
    accountBlockByAddress: {
        hash: string,
        removed: boolean
    },
    unreceivedBlockByAddress: {
        hash: string,
        received: boolean,
        removed: boolean
    },
    vmlog: {
        vmlog:{
            topics: string[],
            data: string
        },
        accountBlockHash: string,
        accountBlockHeight: string,
        address: string,
        removed: boolean
    }
}

export type SubscriptionName = "vmlog" |
    "unreceivedBlockByAddress" |
    "accountBlockByAddress" |
    "accountBlock" |
    "snapshotBlock"