import type WalletConnectClient from '@walletconnect/client';
import { useUrlForm } from '../hooks/form';

type Props = {
  client: WalletConnectClient | null;
};

export const Form: React.VFC<Props> = ({ client }: Props) => {
  const { register, onSubmit } = useUrlForm(client);

  return (
    <form onSubmit={onSubmit} className="flex flex-col justify-center items-center pt-10">
      <input
        {...register('uri', { required: true })}
        placeholder="wc:5a662cc..."
        className="w-80 h-10 bg-gray-100 px-2 border border-gray-900 rounded"
      />

      <button type="reset" className="flex justify-center items-center mt-4 hover:opacity-50">
        <span className="text-lg text-black font-bold leading-none">reset</span>
      </button>

      <button
        type="submit"
        className="flex justify-center items-center h-10 w-40 bg-green-500 rounded-3xl mt-5 hover:opacity-80 shadow"
      >
        <span className="text-lg text-white font-bold leading-none">pairing</span>
      </button>
    </form>
  );
};
