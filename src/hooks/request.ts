import type WalletConnectClient from '@walletconnect/client';
import { ERROR } from '@walletconnect/utils';
import type { SessionTypes } from '@walletconnect/types';
import type Wallet from 'caip-wallet';
import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { cardState, chainsState, requestListState } from '../recoil';
import { useCard } from './card';

export const useRequest = (client: WalletConnectClient | null, wallet: Wallet | null) => {
  const chains = useRecoilValue(chainsState);
  const cardValues = useRecoilValue(cardState);
  const requestList = useRecoilValue(requestListState);
  const setRequestList = useSetRecoilState(requestListState);

  const { resetCard } = useCard(client);

  const removeFromPending = async (requestEvent: SessionTypes.RequestEvent) => {
    setRequestList(requestList.filter((x) => x.request.id !== requestEvent.request.id));
  };

  const approveRequest = async () => {
    if (client === null) return;
    if (wallet === null) return;

    if (cardValues.type === 'request') {
      const { requestEvent } = cardValues.data;

      try {
        const chainId = requestEvent.chainId || chains[0];
        const result = await wallet.request(requestEvent.request as any, { chainId });
        const response = formatJsonRpcResult(requestEvent.request.id, result);
        client.respond({
          topic: requestEvent.topic,
          response,
        });
      } catch (e) {
        console.log(e);
        const response = formatJsonRpcError(requestEvent.request.id, (e as any).message);
        client.respond({ topic: requestEvent.topic, response });
      }

      await removeFromPending(requestEvent);
      resetCard();
    }
  };

  const rejectRequest = async () => {
    if (client === null) return;

    if (cardValues.type === 'request') {
      const { requestEvent } = cardValues.data;

      const error = ERROR.JSONRPC_REQUEST_METHOD_REJECTED.format();
      const response = {
        id: requestEvent.request.id,
        jsonrpc: requestEvent.request.jsonrpc,
        error,
      };
      client.respond({ topic: requestEvent.topic, response });

      await removeFromPending(requestEvent);
      resetCard();
    }
  };

  return {
    approveRequest,
    rejectRequest,
  };
};
