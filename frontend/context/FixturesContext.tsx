import { createContext } from 'react';
import type { Fixtures } from '../../interfaces/main';

const FixturesContext = createContext<Fixtures | null>(null);

export default FixturesContext;
