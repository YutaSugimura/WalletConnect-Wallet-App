import type WalletConnectClient from '@walletconnect/client';
import { useRecoilValue } from 'recoil';
import { cardState, chainDataState } from '../recoil';
import { useSession } from '../hooks/client';
import { getChainName } from '../libs/scripts';
import { MetaData } from '../components/metaData';

type Props = {
  client: WalletConnectClient | null;
};

export const Proposal: React.VFC<Props> = ({ client }: Props) => {
  const chainData = useRecoilValue(chainDataState);
  const cardValues = useRecoilValue(cardState);

  const { approveSession, rejectSession } = useSession(client);

  if (
    cardValues.type !== 'proposal' ||
    !cardValues.data ||
    !cardValues.data.proposal ||
    !cardValues.data.proposal.permissions ||
    !cardValues.data.proposal.permissions.blockchain ||
    !cardValues.data.proposal.permissions.blockchain.chains ||
    !cardValues.data.proposal.permissions.blockchain.chains[0] ||
    !cardValues.data.proposal.proposer ||
    !cardValues.data.proposal.proposer.metadata
  ) {
    return <></>;
  }

  const { proposer, permissions } = cardValues.data.proposal;

  return (
    <div className="flex flex-col justify-center items-center pt-10">
      <h2 className="text-2xl font-bold">proposal</h2>

      <MetaData {...proposer.metadata} />

      <div className="w-80 pt-5">
        <p className="text-lg font-bold">Chains</p>

        <ul className="list-disc list-inside">
          {permissions.blockchain.chains.map((item) => (
            <li key={`chain_${item}`}>
              <span>{getChainName(item, chainData)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-80 pt-5">
        <p className="text-lg font-bold">Chains</p>

        {/* <p>{cardValues.data.proposal}</p> */}
      </div>

      <div className="w-80 pt-5">
        <p className="text-lg font-bold">Methods</p>

        <ul className="list-disc list-inside">
          {permissions.jsonrpc.methods.map((item) => (
            <li key={item}>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between items-center w-80 pt-5">
        <button
          onClick={approveSession}
          className="flex justify-center items-center h-8 w-24 bg-blue-600 rounded-2xl shadow"
        >
          <span className="text-white text-base font-bold leading-none pb-0.5">approve</span>
        </button>

        <button
          onClick={rejectSession}
          className="flex justify-center items-center h-8 w-24 bg-red-500 rounded-2xl shadow"
        >
          <span className="text-white text-base font-bold leading-none pb-0.5">reject</span>
        </button>
      </div>
    </div>
  );
};
