import { useForm } from 'react-hook-form';
import type WalletConnectClient from '@walletconnect/client';

type FormData = {
  uri: string;
};

export const useUrlForm = (client: WalletConnectClient | null) => {
  const { register, handleSubmit, reset } = useForm<FormData>();

  const onSubmit = handleSubmit(async (data) => {
    if (client === null) return;

    try {
      await client.pair({ uri: data.uri });
      reset();
    } catch (e) {
      console.log('error pairing');
      console.error(e);
    }
  });

  return {
    register,
    onSubmit,
    reset,
  };
};
