import { atom } from 'recoil';

export const accountListState = atom({
  key: 'accountListState',
  default: [] as string[],
});
