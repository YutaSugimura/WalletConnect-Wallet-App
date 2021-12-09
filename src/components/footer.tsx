export const Footer: React.VFC = () => {
  return (
    <div className="flex flex-col justify-center items-center pt-10">
      <div className="flex flex-col justify-center items-center w-80">
        <a
          className="text-base text-blue-600 hover:text-blue-300"
          href="https://react-app.walletconnect.com/"
          target="_blank"
          rel="noreferrer"
        >
          Test Dapp
        </a>

        <a
          className="text-base text-blue-600 hover:text-blue-300"
          href="https://walletconnect.com/"
          target="_blank"
          rel="noreferrer"
        >
          WalletConnect App
        </a>

        <a
          className="text-base text-blue-600 hover:text-blue-300"
          href="https://docs.walletconnect.com/"
          target="_blank"
          rel="noreferrer"
        >
          Docs
        </a>

        <a
          className="text-base text-blue-600 hover:text-blue-300"
          href="https://github.com/YutaSugimura/WalletConnect-Wallet-App"
          target="_blank"
          rel="noreferrer"
        >
          gitbhub
        </a>
      </div>
    </div>
  );
};
