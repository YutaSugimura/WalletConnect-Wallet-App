import { useEffect, useState } from 'react';
import WalletConnectClient from '@walletconnect/client';

type Args = {
  debug?: boolean;
};

export const useClientValue = (args?: Args) => {
  const [state, setState] = useState<WalletConnectClient | null>(null);

  useEffect(() => {
    if (state === null) {
      (async () => {
        const client = await WalletConnectClient.init({
          controller: true,
          relayProvider: 'wss://relay.walletconnect.org',
          apiKey: '486a76ffdcaac899c6d6fd345c69fb8c',
          metadata: DEFAULT_APP_METADATA,
          logger: args?.debug ? 'debug' : undefined,
        });

        setState(client);
      })();
    }
  }, [state]);

  return state;
};

export const DEFAULT_APP_METADATA = {
  name: 'React Wallet',
  description: 'React Wallet for WalletConnect',
  url: 'https://walletconnect.org/',
  icons: ['https://walletconnect.org/walletconnect-logo.png'],
};
