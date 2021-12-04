import Wallet from 'caip-wallet';
import { useEffect, useState } from 'react';

export const useWallet = (chains: string[]) => {
  const [state, setState] = useState<Wallet | null>(null);

  useEffect(() => {
    if (state === null) {
      (async () => {
        const wallet = await Wallet.init({ chains });
        setState(wallet);
      })();
    }
  }, []);

  return state;
};
