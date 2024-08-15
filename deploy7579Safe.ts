import { SafeFactory } from '@safe-global/protocol-kit'
import { ethers } from 'ethers'

const RPC_URL = 'https://rpc.ankr.com/eth_sepolia'
const provider = new ethers.JsonRpcProvider(RPC_URL)
const signer = ethers.Wallet.createRandom(provider)


const safeFactory = await SafeFactory.init({
  provider: RPC_URL,
  signer: signer.address
})
