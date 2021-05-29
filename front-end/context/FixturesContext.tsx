import { createContext } from 'react';
import { Fixtures } from '../pages';

const FixturesContext = createContext<{ fixtures: Fixtures; setFixtures: Function } | null>(null);

export default FixturesContext;
