import { useEffect, useState } from 'react';
import Wallet from 'caip-wallet';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { chainsState } from '../recoil';
import { accountListState } from '../recoil/wallet';

export const useWallet = () => {
  const chains = useRecoilValue(chainsState);
  const setAccountList = useSetRecoilState(accountListState);

  const [state, setState] = useState<Wallet | null>(null);

  useEffect(() => {
    if (state === null) {
      (async () => {
        const wallet = await Wallet.init({ chains });
        setState(wallet);

        const accountList = await wallet.getAccounts();
        if (accountList) {
          setAccountList([...accountList]);
        }
      })();
    }
  }, []);

  return state;
};
