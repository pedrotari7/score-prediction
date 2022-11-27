import { createContext } from 'react';

const NoSpoilersContext = createContext<{ noSpoilers: boolean | null; setNoSpoilers: (ns: boolean) => void } | null>(
	null
);

export default NoSpoilersContext;
