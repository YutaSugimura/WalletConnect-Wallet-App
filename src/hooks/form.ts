import { useForm } from 'react-hook-form';
import type WalletConnectClient from '@walletconnect/client';

type FormData = {
  uri: string;
};

export const useUrlForm = (client: WalletConnectClient | null) => {
  const { register, handleSubmit, reset } = useForm<FormData>();

  const onSubmit = handleSubmit((data) => {
    if (client === null) return;

    client.pair({ uri: data.uri });
    reset();
  });

  return {
    register,
    onSubmit,
    reset,
  };
};
