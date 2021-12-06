import { useCallback, useEffect } from 'react';
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client';
import { SessionTypes } from '@walletconnect/types';
import { formatJsonRpcError, formatJsonRpcResult, JsonRpcResponse } from '@json-rpc-tools/utils';
import type Wallet from 'caip-wallet';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { cardState, chainsState, jsonRpcState, requestListState, sessionState } from '../recoil';
import { DEFAULT_EIP155_METHODS } from '../common';

export const useSubscribeEffect = (client: WalletConnectClient | null, wallet: Wallet | null) => {
  const chains = useRecoilValue(chainsState);
  const jsonRpc = useRecoilValue(jsonRpcState);

  const setSessions = useSetRecoilState(sessionState);
  const setCardValues = useSetRecoilState(cardState);
  const [requests, setRequests] = useRecoilState(requestListState);

  const respondRequest = useCallback(
    async (topic: string, response: JsonRpcResponse) => {
      if (client === null) return;

      await client.respond({ topic, response });
    },
    [client],
  );

  useEffect(() => {
    const subscribe = async () => {
      if (client === null) return;

      // Proposal
      client.on(CLIENT_EVENTS.session.proposal, async (proposal: SessionTypes.Proposal) => {
        console.log('EVENT', 'session_proposal');

        const supportedNamespaces: string[] = [];
        chains.forEach((chainId) => {
          const [namespace] = chainId.split(':');
          if (!supportedNamespaces.includes(namespace)) {
            supportedNamespaces.push(namespace);
          }
        });

        const unsupportedChains: string[] = [];
        proposal.permissions.blockchain.chains.forEach((chainId) => {
          if (chains.includes(chainId)) return;
          unsupportedChains.push(chainId);
        });

        if (unsupportedChains.length) {
          return client.reject({ proposal });
        }

        const unsupportedMethods: string[] = [];
        proposal.permissions.jsonrpc.methods.forEach((method) => {
          if (supportedNamespaces.includes('eip155') && DEFAULT_EIP155_METHODS.includes(method)) {
            return;
          }
          unsupportedMethods.push(method);
        });

        if (unsupportedMethods.length) {
          return client.reject({ proposal });
        }

        setCardValues({ type: 'proposal', data: { proposal } });
      });

      // Request
      client.on(CLIENT_EVENTS.session.request, async (requestEvent: SessionTypes.RequestEvent) => {
        if (wallet === null) return;

        console.log('EVENT', 'session_request', requestEvent.request);

        const chainId = requestEvent.chainId || chains[0];
        const [namespace] = chainId.split(':');
        try {
          const requiresApproval = jsonRpc[namespace].methods.sign.includes(
            requestEvent.request.method,
          );

          if (requiresApproval) {
            setRequests([...requests, requestEvent]);
          } else {
            const result = await wallet.request(requestEvent.request, { chainId });
            const response = formatJsonRpcResult(requestEvent.request.id, result);
            await respondRequest(requestEvent.topic, response);
          }
        } catch (e) {
          console.log(e);

          const response = formatJsonRpcError(requestEvent.request.id, (e as any).message);
          await respondRequest(requestEvent.topic, response);
        }
      });

      // Created
      client.on(CLIENT_EVENTS.session.created, async () => {
        console.log('EVENT', 'session_created');

        setSessions(client.session.values);
      });

      // Deleted
      client.on(CLIENT_EVENTS.session.deleted, async () => {
        console.log('EVENT', 'session_deleted');

        setSessions(client.session.values);
      });
    };

    if (client !== null) {
      console.log('run start');
      subscribe();
    }
  }, [client]);
};
