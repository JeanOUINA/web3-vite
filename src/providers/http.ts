import { Provider, InternalSubscription } from "./provider";
import "isomorphic-fetch";
import { SubscriptionName } from "../client";
import { ViteError } from "../errors";
import { EventEmitter } from "../events";
import { nextTick } from "../utils";
import AbortController from "isomorphic-abort-controller"

export const SubscriptionMethodMap = new Map<SubscriptionName, string>()
SubscriptionMethodMap.set("snapshotBlock", "subscribe_newSnapshotBlockFilter")
SubscriptionMethodMap.set("accountBlock", "subscribe_newAccountBlockFilter")
SubscriptionMethodMap.set("accountBlockByAddress", "subscribe_newAccountBlockByAddressFilter")
SubscriptionMethodMap.set("unreceivedBlockByAddress", "subscribe_newUnreceivedBlockByAddressFilter")
SubscriptionMethodMap.set("vmlog", "subscribe_newVmLogFilter")

export class HTTPProvider implements Provider {
    url: string
    headers = new Headers()
    requestId = 0
    constructor(url: string, headers?: Headers) {
        this.url = url
        if(headers)this.headers = headers

        this.headers.set("Content-Type", "application/json")
    }

    pack(data: any): string | Buffer {
        // might implement compression or encryption here
        // but shouldn't be needed
        // at least for http
        return JSON.stringify(data)
    }
    
    async send(req:any){
        if(Array.isArray(req)){
            // batch request
            for(let call of req){
                call.id = this.requestId++
                call.jsonrpc = "2.0"
            }
        }else{
            req.id = this.requestId++
            req.jsonrpc = "2.0"
        }
        const controller = new AbortController()
        setTimeout(() => {
            controller.abort()
        }, 10000)
        const res = await fetch(this.url, {
            headers: this.headers,
            method: "POST",
            body: this.pack(req),
            signal: controller.signal
        })
        if(!res.ok)throw new HTTPError(`Node unreachable: ${res.status} ${res.statusText}`)

        const body = await res.text()
        try{
            return JSON.parse(body)
        }catch{
            throw new HTTPError(`Node didn't return JSON: ${res.status} ${res.statusText}`)
        }
    }

    async subscribe(subscription: SubscriptionName, params: any[]): Promise<InternalSubscription> {
        const method = SubscriptionMethodMap.get(subscription)
        if(!method)throw new Error(`Invalid subscription name: ${subscription}. web3-vite does not recognize this subscription, and is unable to perform the correct call to the node.`)

        const event = await this.send({
            method: method,
            params: params
        })
        if("error" in event){
            throw new ViteError(event)
        }

        let failPoll = 0
        const pollInterval = setInterval(async () => {
            try{
                const result = await this.send({
                    method: "subscribe_getChangesByFilterId",
                    params: [id]
                })
                if("error" in result){
                    throw new ViteError(result)
                }

                failPoll = 0
                for(const item of result.result.result){
                    events.emit("data", item)
                    await nextTick()
                }
            }catch(e){
                failPoll++
                if(failPoll === 48){
                    // 4 minute without connection
                    events.unsubscribe()
                    events.emit("error", e)
                }
            }
        }, 5000)

        const id:string = event.result
        const events:InternalSubscription = new EventEmitter() as any
        events.id = id
        let unsubscribed = false
        events.unsubscribe = async () => {
            if(unsubscribed)return
            unsubscribed = true

            events.emit("close")
            clearInterval(pollInterval)
            // we try to clean this nicely
            // we don't care if it fails, as the node will simply
            // clean it itself after 5 minutes
            // https://github.com/vitelabs/go-vite/blob/master/rpcapi/api/filters/subscribe.go#L18
            await this.send({
                method: "subscribe_uninstallFilter",
                params: [id]
            }).catch(() => {})
        }
        return events
    }
}

export class HTTPError extends Error {
    name = "HTTPError"
}