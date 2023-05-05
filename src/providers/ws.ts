import { Provider, InternalSubscription } from "./provider";
import "isomorphic-fetch";
import { SubscriptionName } from "../client";
import { ViteError } from "../errors";
import { EventEmitter } from "../events";
import { makePromise, nextTick, wait } from "../utils";
import WebSocket from "isomorphic-ws"
import { ClientFlags } from "../client"

export const SubscriptionMethodMap = new Map<SubscriptionName, string>()
SubscriptionMethodMap.set("snapshotBlock", "newSnapshotBlock")
SubscriptionMethodMap.set("accountBlock", "newAccountBlock")
SubscriptionMethodMap.set("accountBlockByAddress", "newAccountBlockByAddress")
SubscriptionMethodMap.set("unreceivedBlockByAddress", "newUnreceivedBlockByAddress")
SubscriptionMethodMap.set("vmlog", "newVmLog")

export class WebsocketProvider extends EventEmitter<{
    ready: [],
    close: [],
    error: [error: Error],
    message: [msg: WebSocket.MessageEvent],
    [key: `subscription_${string}`]: [data: any]
}> implements Provider {
    url: string
    flags: Set<ClientFlags>
    lastPing = 0

    private heartbeatTimeout: NodeJS.Timeout
    private ws: WebSocket
    private requestId = 0
    private requests: Map<number, (data:any) => void> = new Map()
    private queue = []
    constructor(url: string, flags:Set<ClientFlags>) {
        super()
        this.url = url
        this.flags = flags
        this.on("message", this.onMessage.bind(this))
        this.connect()
    }

    onMessage(msg:WebSocket.MessageEvent){
        const data = this.unpack(String(msg.data))
        let promiseId = null
        if(Array.isArray(data)){
            for(const elem of data){
                if(!("id" in elem))continue
                promiseId = elem.id
                break
            }
        }else if("id" in data){
            promiseId = data.id
        }
        if(promiseId !== null){
            if(!this.requests.has(promiseId))return
            this.requests.get(promiseId)(data)
            return
        }
        
        if(data.method !== "subscribe_subscription"){
            console.warn(`[web3-vite]: Received data does not have an id and isn't a subscription:`, data)
            return
        }

        this.emit(`subscription_${data.params.subscription}`, data)
    }

    connect(){
        if(this.ws?.readyState === WebSocket.OPEN)return
        const ws = this.ws = new WebSocket(this.url)
        ws.onopen = () => {
            this.emit("ready")
            for(const elem of this.queue){
                ws.send(elem)
            }
            if(this.flags.has(ClientFlags.Heartbeat)){
                this.send({
                    method: "heartbeat_enable",
                    params: []
                })
                .then(result => {
                    if("error" in result){
                        //console.warn(`[web3-vite]: The current server appears to not support heartbeat. Ignoring the "Heartbeat" flag.`)
                        //console.warn(new ViteError(result))
                        return
                    }

                    // we need to send heartbeats
                    const heartbeat = setInterval(() => {
                        this.send({
                            method: "heartbeat_heartbeat",
                            params: [Date.now()]
                        })
                        if(!this.heartbeatTimeout){
                            this.heartbeatTimeout = setTimeout(() => {
                                this.ws.close()
                            }, 15000)
                        }
                    })
                    this.once("close", () => {
                        clearInterval(heartbeat)
                        clearTimeout(this.heartbeatTimeout)
                        this.heartbeatTimeout = null
                    })
                    
                }).catch(() => {})
            }
        }
        ws.onclose = (ev) => {
            this.emit("close")
            console.log("close", ev)
            wait(1000)
            .then(this.connect.bind(this))
        }
        ws.onerror = (err) => {
            this.emit("error", err.error)
        }
        ws.onmessage = (msg) => {
            this.emit("message", msg)
        }
    }

    pack(data: any): string | Buffer {
        return JSON.stringify(data)
    }
    unpack(data: string): any {
        return JSON.parse(data)
    }
    
    async send(req:any){
        const [promise, resolve, reject] = makePromise()

        const promiseId = this.requestId
        const timeout = setTimeout(() => {
            reject(new Error("Request timed out (60 seconds)"))
            this.requests.delete(promiseId)
        }, 60000)
        this.requests.set(promiseId, resolve)

        if(Array.isArray(req)){
            // batch request
            for(const call of req){
                call.id = this.requestId++
                call.jsonrpc = "2.0"
            }
        }else{
            req.id = this.requestId++
            req.jsonrpc = "2.0"
        }
        
        if(this.ws?.readyState !== WebSocket.OPEN){
            this.queue.push(this.pack(req))
        }else{
            this.ws.send(this.pack(req))
        }
        
        const body = await promise
        clearTimeout(timeout)
        this.requests.delete(promiseId)

        return body
    }

    async subscribe(subscription: SubscriptionName, params: any[]): Promise<InternalSubscription> {
        const method = SubscriptionMethodMap.get(subscription)
        if(!method)throw new Error(`Invalid subscription name: ${subscription}. web3-vite does not recognize this subscription, and is unable to perform the correct call to the node.`)

        const event = await this.send({
            method: "subscribe_subscribe",
            params: [method, ...params]
        })
        if("error" in event){
            throw new ViteError(event)
        }

        const id:string = event.result
        const events:InternalSubscription = new EventEmitter() as any
        events.id = id
        let unsubscribed = false
        const listener = async (data) => {
            for(const elem of data.params.result){
                events.emit("data", elem)
                await nextTick()
            }
        }
        this.on(`subscription_${id}`, listener)
        events.unsubscribe = async () => {
            if(unsubscribed)return
            unsubscribed = true

            events.emit("close")
            // somehow go-vite does not have an unsubscribe method
            // won't clean deeper
            this.off(`subscription_${id}`, listener)
        }
        return events
    }
}

export class HTTPError extends Error {
    name = "HTTPError"
}