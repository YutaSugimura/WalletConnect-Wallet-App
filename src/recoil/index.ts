import { atom } from 'recoil';
import type { SessionTypes } from '@walletconnect/types';
import type { CardStateType, ChainJsonRpc, ChainNamespaces } from '../types';
import { DEFAULT_CHAINS } from '../common';

export const chainsState = atom({
  key: 'chainsState',
  default: DEFAULT_CHAINS,
});

export const chainDataState = atom({
  key: 'chainDataState',
  default: {} as ChainNamespaces,
});

export const jsonRpcState = atom({
  key: 'jsonRpcState',
  default: {} as Record<string, ChainJsonRpc>,
});

export const sessionState = atom({
  key: 'sessionState',
  default: [] as SessionTypes.Created[],
});

export const requestListState = atom({
  key: 'requestListState',
  default: [] as SessionTypes.RequestEvent[],
});

export const cardState = atom({
  key: 'cardState',
  default: { type: 'default' } as CardStateType,
});
