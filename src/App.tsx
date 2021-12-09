import { useRecoilValue } from 'recoil';
import { cardState } from './recoil';
import { isConnectedState } from './recoil/selector';
import { useClientValue } from './hooks/client';
import { useWallet } from './hooks/wallet';
import { useChainDataEffect, useChainJsonRpcEffect } from './hooks/chain';
import { useSubscribeEffect } from './hooks/subscribe';
import { useCheckPersistedEffect } from './hooks/persisted';
import { Container } from './components/container';
import { Form } from './components/form';
import { Proposal } from './components/proposal';
import { Session } from './components/session';
import { Request } from './components/request';
import { Footer } from './components/footer';

const App: React.VFC = () => {
  const client = useClientValue();
  const wallet = useWallet();

  const isConnected = useRecoilValue(isConnectedState);
  const cardData = useRecoilValue(cardState);

  useChainDataEffect();
  useChainJsonRpcEffect();
  useSubscribeEffect(client, wallet);
  useCheckPersistedEffect(client);

  if (cardData.type === 'request') {
    return <Request client={client} wallet={wallet} />;
  }

  if (cardData.type === 'proposal') {
    return <Proposal client={client} />;
  }

  if (isConnected) {
    return <Session client={client} />;
  }

  // Initial Screen
  return <Form client={client} />;
};

const Wrap: React.VFC = () => (
  <Container>
    <App />
    <Footer />
  </Container>
);

export default Wrap;
