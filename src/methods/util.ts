import { Client } from "../client";
import { _Buffer as Buffer } from "../utils";

export class UtilMethodsManager {
    private client: Client

    constructor(client:Client){
        this.client = client
    }

    async getPoWNonce(difficulty:string, hash:string){
        return this.client.request<string>("util_getPoWNonce", [
            difficulty,
            hash
        ]).then(nonce => {
            return Buffer.from(nonce, "base64").toString("hex")
        })
    }
}