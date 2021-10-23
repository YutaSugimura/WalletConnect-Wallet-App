import { useEffect, useState } from 'react';
import WalletConnectClient from '@walletconnect/client';
import { CLIENT_EVENTS } from '@walletconnect/client';
import { ERROR, getAppMetadata } from '@walletconnect/utils';
import { SessionTypes } from '@walletconnect/types';
// import { ethers } from 'ethers';

import { DEFAULT_CHAINS, DEFAULT_EIP155_METHODS } from './common';
import { ChainJsonRpc, ChainNamespaces, ChainsMap, DEFAULT_APP_METADATA } from './types';
import { apiGetChainJsonRpc, apiGetChainNamespace } from './libs/api';

const App: React.VFC = () => {
  const [uri, setUri] = useState('');
  const [client, setClient] = useState<WalletConnectClient | null>(null);

  const [chains] = useState(DEFAULT_CHAINS);
  const [chainData, setChainData] = useState<ChainNamespaces>({});
  const [jsonRpc, setJsonRpc] = useState<Record<string, ChainJsonRpc>>({});
  const [requests, setRequests] = useState<SessionTypes.RequestEvent[]>([]);
  const [sessions, setSessions] = useState<SessionTypes.Created[]>([]);

  const [cardStatus, setCardStatus] = useState<{
    type: 'default' | 'proposal' | 'session';
    data?: any;
  }>({
    type: 'default',
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    loadChainData();
    loadChainJsonRpc();

    (async () => {
      const _client = await WalletConnectClient.init({
        controller: true,
        relayProvider: 'wss://relay.walletconnect.org',
        apiKey: '486a76ffdcaac899c6d6fd345c69fb8c',
        metadata: DEFAULT_APP_METADATA,
        // logger: 'debug',
      });

      setClient(_client);
    })();
  }, []);

  const pairing = () => {
    if (client === null) return;
    if (uri === '') return;

    client.pair({ uri });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUri(event.target.value);
  };

  const resetForm = () => {
    setUri('');
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
        console.log('EVENT', 'session_request', requestEvent.request);

        const chainId = requestEvent.chainId || chains[0];
        const [namespace] = chainId.split(':');
        try {
          const requiresApproval = jsonRpc[namespace].methods.sign.includes(
            requestEvent.request.method,
          );
          if (requiresApproval) {
            setRequests([...requests, requestEvent]);
          }
        } catch (e) {
          console.log(e);
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

  // Persisted
  useEffect(() => {
    const checkPersistedState = async () => {
      if (client === null) return;

      const requests = client.session.history.pending;
      const sessions = client.session.values;
      console.log(sessions);
      setRequests([...requests]);
      setSessions([...sessions]);
      sessions.length > 0 && setIsConnected(true);
    };

    if (client !== null) {
      checkPersistedState();
    }
  }, [client]);

  /** ============= session ======================== */
  const approveSession = async (proposal: SessionTypes.Proposal) => {
    if (client === null) return;

    console.log('ACTION', 'approveSession');

    const targetAddress = '0x9C26CF80B9CAE7a793CE243cb0CE6A977F2f895f';
    const account = proposal.permissions.blockchain.chains[0] + ':' + targetAddress;
    const accounts = [account];

    await client.approve({
      proposal,
      response: { state: { accounts } },
    });

    setCardStatus({ type: 'default' });
    setIsConnected(true);
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

  /** ============= Request ======================== */
  const approveRequest = async (requestEvent: SessionTypes.RequestEvent) => {
    if (client === null) return;

    try {
      const chainId = requestEvent.chainId || chains[0];
      console.log(chainId);

      // const result = await
    } catch (e) {
      console.log(e);
      // client.respond({ topic: requestEvent.topic });
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-4">
      <p>test</p>

      <div className="pt-4">
        <h2>uri</h2>
        <input className="w-80 h-10 border border-gray-800" value={uri} onChange={handleChange} />
        <button onClick={resetForm}>reset</button>
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
            <>
              <button onClick={() => approveSession(cardStatus.data.proposal)}>approve</button>
              <button onClick={() => rejectSession(cardStatus.data.proposal)}>reject</button>
            </>
          )}
        </div>
      )}

      {isConnected && (
        <>
          <button onClick={() => disconnect(sessions[sessions.length - 1].topic)}>
            disconnect
          </button>
        </>
      )}
    </div>
  );
};

export default App;
