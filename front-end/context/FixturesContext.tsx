import { createContext } from 'react';
import { Fixtures } from '../components/Fixtures';

const FixturesContext = createContext<Fixtures | null>(null);

export default FixturesContext;
