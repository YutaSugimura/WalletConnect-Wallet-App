import type WalletConnectClient from '@walletconnect/client';
import type { SessionTypes } from '@walletconnect/types';
import { useSetRecoilState } from 'recoil';
import { cardState } from '../recoil';

export const useCard = (client: WalletConnectClient | null) => {
  const setCardValues = useSetRecoilState(cardState);

  const openRequest = (requestEvent: SessionTypes.RequestEvent) => async () => {
    if (client === null) return;

    const { peer } = await client.session.get(requestEvent.topic);
    setCardValues({ type: 'request', data: { requestEvent, peer } });
  };

  const resetCard = () => {
    setCardValues({ type: 'default' });
  };

  return {
    openRequest,
    resetCard,
  };
};
