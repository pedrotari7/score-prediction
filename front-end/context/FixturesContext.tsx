import { createContext } from 'react';
import { Fixtures } from '../components/Fixtures';

const FixturesContext = createContext<{ fixtures: Fixtures; setFixtures: Function } | null>(null);

export default FixturesContext;
