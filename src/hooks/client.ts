import { useEffect, useState } from 'react';
import WalletConnectClient from '@walletconnect/client';
import { ERROR, getAppMetadata } from '@walletconnect/utils';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { cardState, sessionState } from '../recoil';
import { accountListState } from '../recoil/wallet';
import { useCard } from './card';
import { DEFAULT_APP_METADATA } from '../common';

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

export const useSession = (client: WalletConnectClient | null) => {
  const cardValues = useRecoilValue(cardState);
  const accountList = useRecoilValue(accountListState);

  const setSessions = useSetRecoilState(sessionState);

  const { resetCard } = useCard(client);

  const approveSession = async () => {
    if (client === null) return;
    if (!accountList.length) return;

    if (cardValues.type === 'proposal') {
      const proposal = cardValues.data.proposal;

      console.log('ACTION', 'approveSession');

      const accounts = accountList.filter((account) => {
        const [namespace, reference] = account.split(':');
        const chainId = `${namespace}:${reference}`;
        return proposal.permissions.blockchain.chains.includes(chainId);
      });

      const session = await client.approve({
        proposal,
        response: { state: { accounts }, metadata: getAppMetadata() || DEFAULT_APP_METADATA },
      });

      resetCard();
      setSessions([session]);
    }
  };

  const rejectSession = async () => {
    if (client === null) return;

    if (cardValues.type === 'proposal') {
      const proposal = cardValues.data.proposal;

      console.log('ACTION', 'rejectSession');

      await client.reject({ proposal });
      resetCard();
    }
  };

  const disconnect = (topic: string) => async () => {
    if (client === null) return;

    console.log('ACTION', 'disconnect');

    await client.disconnect({ topic, reason: ERROR.USER_DISCONNECTED.format() });
  };

  const ping = (topic: string) => async () => {
    if (client === null) return;

    try {
      await client.ping({ topic });
    } catch {
      console.log('not connected');
    }
  };

  return {
    approveSession,
    rejectSession,
    ping,
    disconnect,
  };
};
