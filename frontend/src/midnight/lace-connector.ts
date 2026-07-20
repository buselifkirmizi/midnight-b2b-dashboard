export interface InitialAPI {
  name: string;
  icon: string;
  apiVersion: string;
  isEnabled(): Promise<boolean>;
  connect(networkId: string): Promise<ConnectedAPI>;
}

export interface ConnectedAPI {
  state(): Promise<any>;
  serviceUriConfig(): Promise<{
    indexerUri: string;
    indexerWsUri: string;
    proverServerUri: string;
    substrateNodeUri: string;
  }>;
  balanceAndProveTransaction?(tx: unknown, newCoins: unknown): Promise<unknown>;
  submitTransaction?(tx: unknown): Promise<unknown>;
}

declare global {
  interface Window {
    midnight?: Record<string, InitialAPI>;
  }
}

export function findInstalledWallets(): InitialAPI[] {
  if (typeof window === 'undefined' || !window.midnight) return [];
  return Object.values(window.midnight).filter(
    (w) => w && typeof w.connect === 'function'
  );
}

export function isLaceInstalled(): boolean {
  return findInstalledWallets().length > 0;
}

export async function connectLace(): Promise<ConnectedAPI> {
  const wallets = findInstalledWallets();
  if (wallets.length === 0) {
    throw new Error('No Midnight wallet found. Please install Lace and refresh the page.');
  }
  const wallet = wallets[0];
  const connected = await wallet.connect('preprod');
  return connected;
}
