import { SubscriptionName } from "../client"
import { EventEmitter } from "../events"

export abstract class Provider {
    url: string

    abstract send(data: any): Promise<any>
    abstract pack(data: any): string|Buffer
    abstract subscribe(subscription:SubscriptionName, params: any[]): Promise<InternalSubscription>
}

export class NodeError extends Error {
    name = "NodeError"
}

export interface InternalSubscription extends EventEmitter<{
    data: [any],
    error: [Error],
    close: []
}> {
    id: string,
    unsubscribe():void
}