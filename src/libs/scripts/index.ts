import { ChainNamespaces } from '../../types';

export const getChainName = (chain: string, chainData: ChainNamespaces) => {
  const chainId = chain.replace('eip155:', '');
  return chainData.eip155[chainId] ? chainData.eip155[chainId].name : '';
};
