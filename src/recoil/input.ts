import { atom } from 'recoil';

export const uriInputState = atom({
  key: 'uriInputState',
  default: null as null | string,
});
