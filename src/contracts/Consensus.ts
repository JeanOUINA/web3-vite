import { Client } from "../client";
import { Contract } from "../contract";

export default class Consensus extends Contract {
    constructor(client:Client){
        super(
            client,
            "vite_0000000000000000000000000000000000000004d28108e76b",
            [
                {"type":"function","name":"Register", "inputs":[{"name":"gid","type":"gid"},{"name":"sbpName","type":"string"},{"name":"blockProducingAddress","type":"address"}]},
                {"type":"function","name":"RegisterSBP", "inputs":[{"name":"sbpName","type":"string"},{"name":"blockProducingAddress","type":"address"},{"name":"rewardWithdrawAddress","type":"address"}]},
                
                {"type":"function","name":"UpdateRegistration", "inputs":[{"name":"gid","type":"gid"},{"name":"sbpName","type":"string"},{"name":"blockProducingAddress","type":"address"}]},
                {"type":"function","name":"UpdateBlockProducingAddress", "inputs":[{"name":"gid","type":"gid"},{"name":"sbpName","type":"string"},{"name":"blockProducingAddress","type":"address"}]},
                {"type":"function","name":"UpdateSBPBlockProducingAddress", "inputs":[{"name":"sbpName","type":"string"},{"name":"blockProducingAddress","type":"address"}]},
                
                {"type":"function","name":"UpdateSBPRewardWithdrawAddress", "inputs":[{"name":"sbpName","type":"string"},{"name":"rewardWithdrawAddress","type":"address"}]},
            
                {"type":"function","name":"CancelRegister","inputs":[{"name":"gid","type":"gid"}, {"name":"sbpName","type":"string"}]},
                {"type":"function","name":"Revoke","inputs":[{"name":"gid","type":"gid"}, {"name":"sbpName","type":"string"}]},
                {"type":"function","name":"RevokeSBP","inputs":[{"name":"sbpName","type":"string"}]},

                {"type":"function","name":"Reward","inputs":[{"name":"gid","type":"gid"},{"name":"sbpName","type":"string"},{"name":"receiveAddress","type":"address"}]},
                {"type":"function","name":"WithdrawReward","inputs":[{"name":"gid","type":"gid"},{"name":"sbpName","type":"string"},{"name":"receiveAddress","type":"address"}]},
                {"type":"function","name":"WithdrawSBPReward","inputs":[{"name":"sbpName","type":"string"},{"name":"receiveAddress","type":"address"}]},
                
                {"type":"function","name":"Vote", "inputs":[{"name":"gid","type":"gid"},{"name":"sbpName","type":"string"}]},
                {"type":"function","name":"VoteForSBP", "inputs":[{"name":"sbpName","type":"string"}]},
                {"type":"function","name":"CancelVote","inputs":[{"name":"gid","type":"gid"}]},
                {"type":"function","name":"CancelSBPVoting","inputs":[]},
            ] as any
        )
    }

    async getOwnedSBPList(address:string){
        return this.client.methods.contract.getSBPList(address)
    }

    async getSBPList(){
        return this.client.methods.contract.getSBPVoteList()
    }

    async getSBP(sbpName:string){
        return this.client.methods.contract.getSBP(sbpName)
    }

    async getSBPRewardPendingWithdrawal(sbpName:string){
        return this.client.methods.contract.getSBPRewardPendingWithdrawal(sbpName)
    }

    async getSBPRewardsByTimestamp(timestamp:number){
        return this.client.methods.contract.getSBPRewardsByTimestamp(timestamp)
    }

    async getSBPRewardsByCycle(cycle:string){
        return this.client.methods.contract.getSBPRewardsByCycle(cycle)
    }

    async getVotedSBP(address:string){
        return this.client.methods.contract.getVotedSBP(address)
    }

    async getSBPVoteDetailsByCycle(cycle:string){
        return this.client.methods.contract.getSBPVoteDetailsByCycle(cycle)
    }
}