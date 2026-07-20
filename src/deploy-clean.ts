import { NetworkId as ZswapNetworkId } from '@midnight-ntwrk/zswap';
import { setNetworkId, type NetworkId as JsNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { UnshieldedAddress, MidnightBech32m } from '@midnight-ntwrk/wallet-sdk-address-format';

const JS_NETWORK: JsNetworkId = 'TestNet';
const ZSWAP_NETWORK = ZswapNetworkId.TestNet;
setNetworkId(JS_NETWORK);

import { WalletBuilder } from '@midnight-ntwrk/wallet';
import { Transaction, nativeToken } from '@midnight-ntwrk/ledger';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { firstValueFrom, filter } from 'rxjs';
import { Contract } from '../managed/contract/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preview.midnight.network',
  proofServer: 'http://127.0.0.1:6300',
};

const zkConfigPath = path.resolve(__dirname, '..', 'managed');

const witnesses = {
  clientName: (ctx: any): [any, Uint8Array] => [ctx.privateState, new Uint8Array(32)],
  paymentAmount: (ctx: any): [any, bigint] => [ctx.privateState, 0n],
  projectScope: (ctx: any): [any, Uint8Array] => [ctx.privateState, new Uint8Array(64)],
};

async function main() {
  console.log('Building wallet for Preview...');
  const seed = process.env.WALLET_SEED ?? '51125ce3094919d52bacbdef148d47dbe13753abd3f64acae1548d23906232e4';

  const wallet = await WalletBuilder.buildFromSeed(
    CONFIG.indexer,
    CONFIG.indexerWS,
    CONFIG.proofServer,
    CONFIG.node,
    seed,
    ZSWAP_NETWORK,
    'info',
  );

  wallet.start();

  const state = await firstValueFrom(wallet.state());
  const legacyRaw = (state as any).addressLegacy as string;
  const hexPart = legacyRaw.split('|')[0];
  const unshieldedBech32 = MidnightBech32m.encode(
    'preview',
    new UnshieldedAddress(Buffer.from(hexPart, 'hex')),
  ).toString();

  console.log('Unshielded address:', unshieldedBech32);
  console.log('Waiting for funds (should already be funded)...');

  const funded = await firstValueFrom(
    wallet.state().pipe(filter((s) => s.balances[nativeToken()] > 0n)),
  );

  console.log('Wallet funded! Balance:', funded.balances[nativeToken()].toString());

  const providers: any = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'agreement-private-state',
    }),
    zkConfigProvider: new NodeZkConfigProvider(zkConfigPath),
    proofProvider: httpClientProofProvider(CONFIG.proofServer),
    publicDataProvider: indexerPublicDataProvider(CONFIG.indexer, CONFIG.indexerWS),
    walletProvider: {
      coinPublicKey: funded.coinPublicKey,
      encryptionPublicKey: funded.encryptionPublicKey,
      balanceTx: (tx: any, newCoins: any) =>
        wallet
          .balanceTransaction(
            ZswapTransaction.deserialize(tx.serialize(JS_NETWORK), ZSWAP_NETWORK),
            newCoins,
          )
          .then((balanced: any) => wallet.proveTransaction(balanced))
          .then((proven: any) => Transaction.deserialize(proven.serialize(ZSWAP_NETWORK), JS_NETWORK)),
    },
    midnightProvider: {
      submitTx: (tx: any) => wallet.submitTransaction(tx),
    },
  };

  console.log('Deploying Agreement contract to Preview...');
  const contract = new Contract(witnesses);

  const deployed = await deployContract(providers, {
    contract,
    privateStateId: 'agreement-private-state',
    initialPrivateState: {},
  } as any);

  const contractAddress = (deployed as any).deployTxData.public.contractAddress;
  const txHash = (deployed as any).deployTxData.public.txHash;

  console.log('=== DEPLOYMENT SUCCESSFUL ===');
  console.log('Contract address:', contractAddress);
  console.log('Tx hash:', txHash);

  fs.writeFileSync(
    path.resolve(__dirname, '..', 'deployment.json'),
    JSON.stringify({ network: 'preview', contractAddress, txHash, deployedAt: new Date().toISOString() }, null, 2)
  );

  console.log('Saved to deployment.json.');
  await wallet.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
