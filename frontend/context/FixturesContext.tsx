import { createContext } from 'react';
import { Fixtures } from '../../interfaces/main';

const FixturesContext = createContext<Fixtures | null>(null);

export default FixturesContext;
