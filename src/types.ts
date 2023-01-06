export enum BlockType {
    SendCreateContract = 0x01,
    SendCall = 0x02,
    SendReward = 0x03,
    Receive = 0x04,
    ReceiveError = 0x05,
    SendRefund = 0x06,
    GenesisReceive = 0x07
}

export interface AccountBlockV2 {
    blockType: BlockType,
    height: string,
    hash: string,
    previousHash: string,
    address: string,
    publicKey: string,
    producer: string,
    fromAddress: string,
    toAddress: string,
    sendBlockHash: string,
    tokenId: string,
    amount: string,
    fee: string,
    data: string,
    difficulty?: string,
    nonce?: string,
    signature: string,
    quotaByStake: string,
    totalQuota: string
    vmLogHash?: string,
    triggeredSendBlockList?: AccountBlockV2[],
    tokenInfo?: TokenInfo,
    confirmations: string,
    firstSnapshotHash: string,
    receiveBlockHeight: string,
    receiveBlockHash: string,
    timestamp: number
}

export interface TokenInfo {
    tokenName: string,
    tokenSymbol: string,
    totalSupply: string,
    decimals: number,
    owner: string,
    tokenId: string,
    maxSupply: string,
    ownerBurnOnly: boolean,
    isReIssuable: boolean,
    index: number,
    isOwnerBurnOnly: boolean
}

export interface SnapshotBlock {
    producer: string,
    hash: string,
    previousHash: string,
    height: number,
    publicKey: string,
    signature: string,
    seed: number,
    nextSeedHash: string,
    snapshotData: {
        [address:string]: {
            height: number,
            hash: string
        }
    },
    timestamp: number
}

export interface AccountInfo {
    address: string,
    blockCount: string,
    balanceInfoMap?: {
        [tokenId: string]: {
            balance: string,
            tokenInfo: TokenInfo
        }
    }
}

export interface VmLog {
    topics: string[],
    data: string
}

export interface BaseSyncInfo {
    from: string,
    to: string,
    current: string,
    status: string
}

export interface SyncInfo extends BaseSyncInfo {
    state: number
}

export interface SyncDetail extends BaseSyncInfo {
    state: string,
    tasks: string[],
    connections: {
        address: string,
        speed: string
    }[],
    chunks: {
        height: number,
        hash: string
    }[],
    caches: {
        Bound: number[],
        Hash: string,
        PrevHash: string
    }[]
}

export interface NodeInfo {
    id: string,
    name: string,
    netId: number,
    address: string,
    peerCount: number,
    height: number,
    nodes: number,
    latency: number[],
    broadCheckFailedRatio: number,
    server: any,
    peers: NodePeer[]
}

export interface NodePeer {
    id: string,
    name: string,
    version: number,
    height: number,
    address: string,
    flag: number,
    superior: boolean,
    reliable: boolean,
    createAt: string,
    readQueue: number,
    writeQueue: number,
    peers: string[]
}

export interface ContractInfo {
    code: string,
    gid: string,
    confirmTime: number,
    responseLatency: number,
    seedCount: number,
    randomDegree: number,
    quotaRatio: number,
    quotaMultiplier: number,
}

export interface QuotaInfo {
    currentQuota: string,
    maxQuota: string,
    stakeAmount: string
}

export interface StakeListInfo {
    totalStakeAmount: string,
    totalStakeCount: string,
    stakeList: StakeInfo[]
}

export interface StakeInfo {
    stakeAddress: string,
    stakeAmount: string,
    expirationHeight: string,
    beneficiary: string,
    expirationTime: number,
    isDelegated: boolean,
    delegateAddress: string,
    bid: number
}
export interface SBPInfo {
    name: string,
    blockProducingAddress: string,
    stakeAddress: string,
    rewardWithdrawAddress: string,
    stakeAmount: string,
    expirationHeight: string,
    expirationTime: number,
    revokeTime: number
}
export interface RewardInfo {
    totalReward: string,
    blockProducingReward: string,
    votingReward: string,
    allRewardWithdrawed: boolean
}
export interface RewardByDayInfo {
    startTime: number,
    endTime: number,
    cycle: string,
    rewardMap: {
        [sbpName: string]: RewardInfo
    }
}
export interface SBPVoteInfo {
    sbpName: string,
    blockProducingAddress: string,
    votes: string
}
export interface VoteInfo {
    blockProducerName: string,
    status: number,
    votes: string
}
export interface SBPVoteDetail {
    blockProducerName: string,
    totalVotes: string,
    blockProducingAddress: string,
    historyProducingAddresses: [string],
    addressVoteMap: {
        [address: string]: string
    }
}
export interface TokenListInfo {
    totalCount: number,
    tokenInfoList: TokenInfo[]
}
export interface GetPoWDifficultyResult {
    requiredQuota: string
    difficulty: string
    qc: string
    isCongestion: boolean
}