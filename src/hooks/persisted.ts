import { useEffect } from 'react';
import type WalletConnectClient from '@walletconnect/client';
import { useSetRecoilState } from 'recoil';
import { requestListState, sessionState } from '../recoil';

export const useCheckPersistedEffect = (client: WalletConnectClient | null) => {
  const setSessions = useSetRecoilState(sessionState);
  const setRequests = useSetRecoilState(requestListState);

  useEffect(() => {
    const checkPersistedState = async () => {
      if (client === null) return;

      console.log('ACTION', 'checkPersisted');

      setRequests([...client.session.history.pending]);
      setSessions([...client.session.values]);
    };

    if (client !== null) {
      checkPersistedState();
    }
  }, [client]);
};
