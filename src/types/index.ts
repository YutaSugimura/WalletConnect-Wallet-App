export interface ChainData {
  name: string;
  id: string;
  rpc: string[];
  slip44: number;
  testnet: boolean;
}

export interface ChainsMap {
  [reference: string]: ChainData;
}

export interface ChainJsonRpc {
  methods: {
    chain: string[];
    accounts: string[];
    request: string[];
    sign: string[];
    [scope: string]: string[];
  };
}

export interface ChainNamespaces {
  [namespace: string]: ChainsMap;
}

export const DEFAULT_APP_METADATA = {
  name: 'React Wallet',
  description: 'React Wallet for WalletConnect',
  url: 'https://walletconnect.org/',
  icons: ['https://walletconnect.org/walletconnect-logo.png'],
};
