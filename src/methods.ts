import { Client } from "./client";
import { ContractMethodsManager } from "./methods/contract";
import { LedgerMethodsManager } from "./methods/ledger";
import { NetMethodsManager } from "./methods/net";
import { UtilMethodsManager } from "./methods/util";

export class MethodManager {
    constructor(client:Client){
        this.ledger = new LedgerMethodsManager(client)
        this.net = new NetMethodsManager(client)
        this.contract = new ContractMethodsManager(client)
        this.util = new UtilMethodsManager(client)
    }

    ledger:LedgerMethodsManager
    net:NetMethodsManager
    contract:ContractMethodsManager
    util:UtilMethodsManager
}