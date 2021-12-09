type Props = {
  children: React.ReactNode;
};

export const Container: React.VFC<Props> = ({ children }: Props) => (
  <div className="h-screen w-screen">
    <div className="container h-full px-4 mx-auto">
      <div className="flex justify-center items-center h-20">
        <h1 className="text-2xl font-bold">Wallet</h1>
      </div>

      <div className="main-content pb-10">{children}</div>
    </div>
  </div>
);
