type Props = {
  icons: string[];
  name: string;
  url: string;
  description: string;
};

export const MetaData: React.VFC<Props> = ({ icons, name, url, description }: Props) => {
  return (
    <div className="w-80 pt-2">
      <p className="text-lg font-bold">App</p>

      <div className="w-full pt-2">
        <div className="flex w-full">
          <img
            src={icons[0]}
            alt="icon"
            width={48}
            height={48}
            className="border-2 rounded-lg shadow"
          />

          <div className="pl-2">
            <p className="text-sm font-bold">{name}</p>

            <a className="text-sm text-blue-400" href={url} target="_blank" rel="noreferrer">
              App
            </a>
          </div>
        </div>

        <div className="w-full pt-1">
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
};
