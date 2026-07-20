import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
setNetworkId('preview');

import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createLogger } from './logger-utils.js';
import { PreviewRemoteConfig } from './config.js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { generateDust } from './generate-dust.js';
import { waitForUnshieldedFunds, syncWallet } from './wallet-utils.js';

import { CompiledAgreementContract, createAgreementPrivateState } from './contract-index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const config = new PreviewRemoteConfig();
  const logger = await createLogger(config.logDir);
  const testEnv = config.getEnvironment(logger);
  const providersToBeStopped: MidnightWalletProvider[] = [];
  try {
    logger.info('Starting Preview test environment...');
    await testEnv.start();
    const envConfiguration = await testEnv.getEnvironmentConfiguration();
    logger.info('Env ready.');
    const seed = process.env.WALLET_SEED ?? '51125ce3094919d52bacbdef148d47dbe13753abd3f64acae1548d23906232e4';
    logger.info('Using seed prefix: ' + seed.slice(0, 8));
    const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
    providersToBeStopped.push(walletProvider);
    const walletFacade = walletProvider.wallet;
    await walletProvider.start();
    const unshieldedState = await waitForUnshieldedFunds(logger, walletFacade, envConfiguration, unshieldedToken());
    const nightBalance = unshieldedState.balances[unshieldedToken().raw];
    if (nightBalance === undefined) {
      logger.info('No funds received, exiting.');
      return;
    }
    logger.info('NIGHT balance: ' + nightBalance);
    const dustGeneration = await generateDust(logger, seed, unshieldedState, walletFacade);
    if (dustGeneration) {
      logger.info('Dust generation submitted: ' + dustGeneration);
      await syncWallet(logger, walletFacade);
    }
    const zkConfigProvider = new NodeZkConfigProvider(config.zkConfigPath);
    const providers: any = {
      privateStateProvider: levelPrivateStateProvider({
        privateStateStoreName: config.privateStateStoreName,
        signingKeyStoreName: config.privateStateStoreName + '-signing-keys',
        privateStoragePasswordProvider: () => 'Agreement-Test-2026!',
        accountId: seed,
      }),
      publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
      zkConfigProvider: zkConfigProvider,
      proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
      walletProvider: walletProvider,
      midnightProvider: walletProvider,
    };
    logger.info('Deploying Agreement contract...');
    const deployed = await deployContract(providers, {
      compiledContract: CompiledAgreementContract,
      privateStateId: config.privateStateStoreName,
      initialPrivateState: createAgreementPrivateState(),
    } as any);
    const contractAddress = (deployed as any).deployTxData.public.contractAddress;
    const txHash = (deployed as any).deployTxData.public.txHash;
    logger.info('=== DEPLOYMENT SUCCESSFUL ===');
    logger.info('Contract address: ' + contractAddress);
    logger.info('Tx hash: ' + txHash);
    fs.writeFileSync(
      path.resolve(__dirname, '..', 'deployment.json'),
      JSON.stringify({ network: 'preview', contractAddress, txHash, deployedAt: new Date().toISOString() }, null, 2)
    );
    logger.info('Saved to deployment.json.');
  } catch (e) {
    logger.error(e);
  } finally {
    for (const w of providersToBeStopped) { await w.stop(); }
    if (testEnv) { await testEnv.shutdown(); }
    process.exit(0);
  }
}

main();
