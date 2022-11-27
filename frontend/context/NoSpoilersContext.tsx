import { createContext } from 'react';

const NoSpoilersContext = createContext<{ noSpoilers: boolean; setNoSpoilers: (ns: boolean) => void } | null>(null);

export default NoSpoilersContext;
