import { useEffect } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { chainDataState, chainsState, jsonRpcState } from '../recoil';
import type { ChainJsonRpc, ChainNamespaces, ChainsMap } from '../types';
import { apiGetChainJsonRpc, apiGetChainNamespace } from '../libs/api';

const getAllNamespaces = (chains: string[]) => {
  const namespaces: string[] = [];

  chains.forEach((chainId) => {
    const [namespace] = chainId.split(':');
    if (!namespaces.includes(namespace)) {
      namespaces.push(namespace);
    }
  });

  return namespaces;
};

export const useChainDataEffect = () => {
  const chains = useRecoilValue(chainsState);

  const setChainData = useSetRecoilState(chainDataState);

  useEffect(() => {
    (async () => {
      const namespaces = getAllNamespaces(chains);
      const newChainData: ChainNamespaces = {};

      await Promise.all(
        namespaces.map(async (namespace) => {
          let chains: ChainsMap | undefined;

          try {
            chains = await apiGetChainNamespace(namespace);
          } catch (e) {
            console.error(e as any);
          }

          if (chains) {
            newChainData[namespace] = chains;
          }
        }),
      );

      setChainData({ ...newChainData });
    })();
  }, []);
};

export const useChainJsonRpcEffect = () => {
  const chains = useRecoilValue(chainsState);
  const setJsonRpc = useSetRecoilState(jsonRpcState);

  useEffect(() => {
    (async () => {
      const namespaces = getAllNamespaces(chains);
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
    })();
  }, []);
};
