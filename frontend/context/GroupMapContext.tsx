import { createContext } from 'react';
import type { GroupMap } from '../../interfaces/main';

const GroupMapContext = createContext<GroupMap>({});

export default GroupMapContext;
