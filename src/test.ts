import { Client } from "./client";
import { WalletMnemonics } from "./wallet";

const client = new Client(
    "wss://node-vite.thomiz.dev/proxy"
)
const pow = client
const wallet = new WalletMnemonics("mirror chest music happy extra disorder slush spirit must vague original broken round laugh animal quarter nothing floor brand aisle exotic forest zebra wheel")
const address = wallet.mainAddress

async function main() {
    
}
main()