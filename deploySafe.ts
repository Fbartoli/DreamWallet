import { Safe4337Pack } from '@safe-global/relay-kit'
import { SocialRecoveryModule } from "abstractionkit";
import { randomBytes } from 'ethers';

declare module "bun" {
  interface Env {
    SIGNER_PRIVATE_KEY: string;
    PIMLICO_API_KEY: string;
  }
}

const RPC_URL = 'https://rpc.ankr.com/eth_sepolia'
const SIGNER_PRIVATE_KEY = Bun.env.SIGNER_PRIVATE_KEY
const SIGNER_ADDRESS = "0xc486030887BB2EF7eA20C2e2BbB46097a275436B"
const GUARDIAN_ADDRESS = "0x419DbF471374a81f0aFE0a115AC93C5243778Ec1"
const SAFE_ADDRESS = '0xe3216367fE932B3d1dbdD5fB797c587a1740F149' //optional
const PIMLICO_API_KEY = Bun.env.PIMLICO_API_KEY

const srm = new SocialRecoveryModule();

const safe4337Pack = await Safe4337Pack.init({
  provider: RPC_URL,
  signer: SIGNER_PRIVATE_KEY,
  bundlerUrl: `https://api.pimlico.io/v1/sepolia/rpc?apikey=${PIMLICO_API_KEY}`,
  options: {
    owners: [SIGNER_ADDRESS],
    threshold: 1,
    saltNonce: "10",
  },
  paymasterOptions: {
    isSponsored: true,
    paymasterUrl: `https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`,
  }
})


const safeAddress = await safe4337Pack.protocolKit.getAddress()
console.log(`main safe address ${safeAddress}`)
//Create Savings account
const savingAccount = await Safe4337Pack.init({
  provider: RPC_URL,
  bundlerUrl: `https://api.pimlico.io/v1/sepolia/rpc?apikey=${PIMLICO_API_KEY}`,  
  options: {
    owners: [safeAddress],
    threshold: 1,
  },
})
console.log(`saving safe address ${savingAccount}`)
// Create Recovery
const metaTransaction1 = srm.createEnableModuleMetaTransaction(safeAddress);
const metaTransaction2 = srm.createAddGuardianWithThresholdMetaTransaction(
  safeAddress,
  GUARDIAN_ADDRESS,
  1n //threshold
);

// Define the transactions to execute
const enableRecovery = { to:metaTransaction1.to, data: metaTransaction1.data, value: "0" }
const setRecovery = {...metaTransaction2, value:"0"}
const savingAccountDeployment = await savingAccount.protocolKit.createSafeDeploymentTransaction()


// Build the transaction array
const transactions = [enableRecovery, setRecovery, savingAccountDeployment]

// Create, sign and send the SafeOperation with all the transactions
const safeOperation = await safe4337Pack.createTransaction({ transactions })
const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)
const userOperationHash = await safe4337Pack.executeTransaction({
  executable: signedSafeOperation
})

let userOperationReceipt = null
while (!userOperationReceipt) {
  // Wait 2 seconds before checking the status again
  await new Promise((resolve) => setTimeout(resolve, 2000))
  userOperationReceipt = await safe4337Pack.getUserOperationReceipt(
    userOperationHash
  )
  console.log(userOperationReceipt)
}

// const userOperationPayload = await safe4337Pack.getUserOperationByHash(
//   userOperationHash
// )

