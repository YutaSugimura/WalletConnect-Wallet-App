import { useEffect, useState } from 'react';
import { CLIENT_EVENTS } from '@walletconnect/client';
import { ERROR, getAppMetadata } from '@walletconnect/utils';
import { SessionTypes } from '@walletconnect/types';
import { JsonRpcResponse, formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils';

import { DEFAULT_CHAINS, DEFAULT_EIP155_METHODS } from './common';
import { ChainJsonRpc, ChainNamespaces, ChainsMap } from './types';
import { apiGetChainJsonRpc, apiGetChainNamespace } from './libs/api';

// new
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';
import { uriInputState } from './recoil/input';
import { DEFAULT_APP_METADATA, useClientValue } from './hooks/client';
import { useWallet } from './hooks/wallet';

const App: React.VFC = () => {
  const uriInputValue = useRecoilValue(uriInputState);
  const setUriInputValue = useSetRecoilState(uriInputState);
  const resetUriInputValue = useResetRecoilState(uriInputState);

  const [chains] = useState(DEFAULT_CHAINS);
  const [chainData, setChainData] = useState<ChainNamespaces>({});
  const [jsonRpc, setJsonRpc] = useState<Record<string, ChainJsonRpc>>({});
  const [requests, setRequests] = useState<SessionTypes.RequestEvent[]>([]);
  const [sessions, setSessions] = useState<SessionTypes.Created[]>([]);

  const [cardStatus, setCardStatus] = useState<{
    type: 'default' | 'proposal' | 'session' | 'request';
    data?: any;
  }>({
    type: 'default',
  });

  const [isConnected, setIsConnected] = useState<boolean>(false);

  const client = useClientValue();
  const wallet = useWallet(chains);

  useEffect(() => {
    loadChainData();
    loadChainJsonRpc();
  }, []);

  const pairing = () => {
    if (client === null) return;
    if (uriInputValue === null) return;

    client.pair({ uri: uriInputValue });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUriInputValue(event.target.value);
  };

  const getAllNamespaces = () => {
    const namespaces: string[] = [];
    DEFAULT_CHAINS.forEach((chainId) => {
      const [namespace] = chainId.split(':');
      if (!namespaces.includes(namespace)) {
        namespaces.push(namespace);
      }
    });

    return namespaces;
  };

  const loadChainData = async () => {
    const namespaces = getAllNamespaces();
    const newChainData: ChainNamespaces = {};

    await Promise.all(
      namespaces.map(async (namespace) => {
        let chains: ChainsMap | undefined;
        try {
          chains = await apiGetChainNamespace(namespace);
        } catch (e) {
          console.error(e as any);
        }

        if (typeof chains !== 'undefined') {
          newChainData[namespace] = chains;
        }
      }),
    );

    setChainData({ ...newChainData });
  };

  const loadChainJsonRpc = async () => {
    const namespaces = getAllNamespaces();
    const jsonrpc: Record<string, ChainJsonRpc> = {};

    await Promise.all(
      namespaces.map(async (namespace) => {
        let rpc: ChainJsonRpc | undefined;
        try {
          rpc = await apiGetChainJsonRpc(namespace);
        } catch (e) {
          console.log(e as any);
        }

        if (typeof rpc !== 'undefined') {
          jsonrpc[namespace] = rpc;
        }
      }),
    );

    setJsonRpc({ ...jsonrpc });
  };

  const respondRequest = async (topic: string, response: JsonRpcResponse) => {
    if (client === null) return;

    await client.respond({ topic, response });
  };

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

        setCardStatus({ type: 'proposal', data: { proposal } });
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
        setIsConnected(false);
      });
    };

    if (client !== null) {
      console.log('run start');
      subscribe();
    }
  }, [client]);

  // Persisted
  useEffect(() => {
    const checkPersistedState = async () => {
      if (client === null) return;

      console.log('checkPersisted');

      setRequests([...client.session.history.pending]);
      setSessions([...client.session.values]);
      client.session.values.length && setIsConnected(true);
    };

    if (client !== null) {
      checkPersistedState();
    }
  }, [client]);

  /** Open */
  const openRequest = async (requestEvent: SessionTypes.RequestEvent) => {
    if (client === null) return;

    const { peer } = await client.session.get(requestEvent.topic);
    setCardStatus({ type: 'request', data: { requestEvent, peer } });
  };

  /** ============= Session ======================== */
  const approveSession = async (proposal: SessionTypes.Proposal) => {
    if (client === null) return;
    if (wallet === null) return;

    console.log('ACTION', 'approveSession');

    const currentAccounts: string[] = await wallet.getAccounts();
    const accounts = currentAccounts.filter((account) => {
      const [namespace, reference] = account.split(':');
      const chainId = `${namespace}:${reference}`;
      return proposal.permissions.blockchain.chains.includes(chainId);
    });

    const session = await client.approve({
      proposal,
      response: { state: { accounts }, metadata: getAppMetadata() || DEFAULT_APP_METADATA },
    });

    setCardStatus({ type: 'default' });
    setIsConnected(true);
    setSessions([session]);
  };

  const rejectSession = async (proposal: SessionTypes.Proposal) => {
    if (client === null) return;

    console.log('ACTION', 'rejectSession');

    await client.reject({ proposal });
    setCardStatus({ type: 'default' });
  };

  const disconnect = async (topic: string) => {
    if (client === null) return;

    console.log('ACTION', 'disconnect');

    setIsConnected(false);
    await client.disconnect({ topic, reason: ERROR.USER_DISCONNECTED.format() });
  };

  /** ============= /Session ======================== */

  /** ============= Request ======================== */
  const removeFromPending = async (requestEvent: SessionTypes.RequestEvent) => {
    setRequests(requests.filter((x) => x.request.id !== requestEvent.request.id));
  };

  const approveRequest = async (requestEvent: SessionTypes.RequestEvent) => {
    if (client === null) return;
    if (wallet === null) return;

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
    setCardStatus({ type: 'default' });
  };

  const rejectRequest = async (requestEvent: SessionTypes.RequestEvent) => {
    if (client === null) return;

    const error = ERROR.JSONRPC_REQUEST_METHOD_REJECTED.format();
    const response = {
      id: requestEvent.request.id,
      jsonrpc: requestEvent.request.jsonrpc,
      error,
    };
    client.respond({ topic: requestEvent.topic, response });
    await removeFromPending(requestEvent);
    setCardStatus({ type: 'default' });
  };

  /** ============= /Request ======================== */

  const currentChain = sessions.length
    ? sessions[0].permissions.blockchain.chains[0].replace('eip155:', '')
    : undefined;
  const chainName = currentChain
    ? chainData.eip155[currentChain]
      ? chainData.eip155[currentChain].name
      : ''
    : '';

  if (isConnected) {
    return (
      <div className="flex flex-col justify-center items-center p-4">
        <p>connected</p>
        <p>network: {chainName}</p>

        <ul className="pt-20 pb-10">
          {requests.length > 0 &&
            requests.map((item, index) => (
              <li key={`${item}_${index}`}>
                <button onClick={() => openRequest(item)}>{item.request.method}</button>
              </li>
            ))}
        </ul>

        {cardStatus.type === 'request' && (
          <div>
            <p>request</p>

            <button onClick={() => approveRequest(cardStatus.data.requestEvent)}>approve</button>
            <button onClick={() => rejectRequest(cardStatus.data.requestEvent)}>reject</button>
          </div>
        )}

        <button
          onClick={() => disconnect(sessions[sessions.length - 1].topic)}
          className="text-base text-blue-600"
        >
          disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center p-4">
      <p>test</p>

      <div className="pt-4">
        <h2>uri</h2>
        <input
          className="w-80 h-10 border border-gray-800"
          value={uriInputValue ?? ''}
          onChange={handleChange}
        />
        <button onClick={resetUriInputValue}>reset</button>
      </div>

      <div className="pt-4">
        <h2>pairing</h2>
        <button className="text-base text-blue-600" onClick={pairing}>
          pairing
        </button>
      </div>

      {cardStatus.type === 'proposal' && (
        <div className="pt-10">
          <p>proposal</p>

          <p>Chains</p>
          {cardStatus.data.proposal.permissions.blockchain.chains.map((chainId: string) => (
            <p key={`chainId_${chainId}`}>{chainId}</p>
          ))}

          {cardStatus.data && cardStatus.data.proposal && (
            <div className="flex justify-center w-60">
              <button onClick={() => approveSession(cardStatus.data.proposal)}>approve</button>
              <button onClick={() => rejectSession(cardStatus.data.proposal)}>reject</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
