import { createContext } from 'react';
import { GroupMap } from '../../interfaces/main';

const GroupMapContext = createContext<GroupMap>({});

export default GroupMapContext;
