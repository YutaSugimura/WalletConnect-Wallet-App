import type WalletConnectClient from '@walletconnect/client';
import type Wallet from 'caip-wallet';
import { useRecoilValue } from 'recoil';
import { cardState, chainDataState } from '../recoil';
import { useRequest } from '../hooks/request';
import { getChainName } from '../libs/scripts';
import { MetaData } from '../components/metaData';

type Props = {
  client: WalletConnectClient | null;
  wallet: Wallet | null;
};

export const Request: React.VFC<Props> = ({ client, wallet }: Props) => {
  const cardValues = useRecoilValue(cardState);
  const chainData = useRecoilValue(chainDataState);

  const { approveRequest, rejectRequest } = useRequest(client, wallet);

  if (cardValues.type !== 'request') {
    return <></>;
  }

  const { request, chainId } = cardValues.data.requestEvent;

  return (
    <div className="flex flex-col justify-center items-center pt-10">
      <h2 className="text-2xl font-bold">Request</h2>

      <MetaData {...cardValues.data.peer.metadata} />

      {chainId && (
        <div className="w-80 pt-5">
          <h3 className="text-lg font-bold">Chain</h3>
          <p>
            {getChainName(chainId, chainData)} ({chainId})
          </p>
        </div>
      )}

      <div className="w-80 pt-5">
        <h3 className="text-lg font-bold">ID</h3>
        <p>{request.id}</p>
      </div>

      <div className="w-80 pt-5">
        <h3 className="text-lg font-bold">Methods</h3>

        <p>{request.method}</p>
      </div>

      <div className="w-80 pt-5">
        <h3 className="text-lg font-bold">Params</h3>

        {Array.isArray(request.params as string[]) ? (
          <ul className="w-full whitespace-normal">
            {(request.params as string[]).map((item, index) => (
              <li key={`request_param_${item}_${index}`} className="w-80 pt-2">
                <p className="break-all">{item}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>{request.params}</p>
        )}
      </div>

      <div className="flex justify-between items-center w-80 pt-5 pb-10">
        <button
          onClick={approveRequest}
          className="flex justify-center items-center h-8 w-24 bg-blue-600 rounded-2xl shadow hover:opacity-80"
        >
          <span className="text-white text-base font-bold leading-none pb-0.5">approve</span>
        </button>

        <button
          onClick={rejectRequest}
          className="flex justify-center items-center h-8 w-24 bg-red-500 rounded-2xl shadow hover:opacity-80"
        >
          <span className="text-white text-base font-bold leading-none pb-0.5">reject</span>
        </button>
      </div>
    </div>
  );
};
