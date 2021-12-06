import type WalletConnectClient from '@walletconnect/client';
import { useRecoilValue } from 'recoil';
import { chainDataState, requestListState, sessionState } from '../recoil';
import { useSession } from '../hooks/client';
import { useCard } from '../hooks/card';
import { getChainName } from '../libs/scripts';
import { MetaData } from '../components/metaData';

type Props = {
  client: WalletConnectClient | null;
};

export const Session: React.VFC<Props> = ({ client }: Props) => {
  const chainData = useRecoilValue(chainDataState);
  const sessions = useRecoilValue(sessionState);
  const requestList = useRecoilValue(requestListState);

  const { disconnect } = useSession(client);
  const { openRequest } = useCard(client);

  if (
    !sessions ||
    !sessions.length ||
    !sessions[0] ||
    !sessions[0].permissions ||
    !sessions[0].permissions.blockchain
  ) {
    return <></>;
  }

  return (
    <div className="flex flex-col justify-center items-center pt-10">
      <h2 className="text-2xl font-bold">Session</h2>

      <MetaData {...sessions[0].peer.metadata} />

      <div className="w-80 pt-2">
        <p className="text-lg font-bold">Accounts</p>

        <ul className="list-disc list-inside w-full">
          {sessions[0].state.accounts.map((item, index) => (
            <li
              key={`account_${item}_${index}`}
              className={`
                w-full
                ${index === 0 ? 'pt-1' : 'pt-4'}
              `}
            >
              {getChainName(item.split(':')[1], chainData)}
              <span className="block">{item.split(':')[2]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-80 pt-2">
        <p className="text-lg font-bold">Networks</p>

        <ul className="list-disc list-inside">
          {sessions[0].permissions.blockchain.chains.map((item) => (
            <li key={`chain_${item}`}>{getChainName(item, chainData)}</li>
          ))}
        </ul>
      </div>

      <div className="w-80 pt-5">
        <p className="text-lg font-bold">Requests</p>

        {requestList.length > 0 ? (
          <ul className="w-full list-disc list-inside">
            {requestList.map((item) => (
              <li key={`request_${item.topic}`} className="w-full">
                <span>{item.chainId && getChainName(item.chainId, chainData)}</span>

                <button
                  onClick={openRequest(item)}
                  className="relative w-full h-8 border border-blue-600 rounded-lg text-blue-600 text-lg font-bold ml-4 hover:bg-blue-600 hover:text-white"
                >
                  <span className="flex h-3 w-3 absolute top-2 left-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                  </span>

                  {item.request.method}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-base text-center pt-6">none</p>
        )}
      </div>

      <div className="flex justify-center items-center w-80 pt-20">
        <button
          className="flex justify-center items-center w-40 h-8 bg-red-400 rounded-full shadow"
          onClick={disconnect(sessions[sessions.length - 1].topic)}
        >
          <span className="text-white text-base">disconnect!</span>
        </button>
      </div>
    </div>
  );
};
