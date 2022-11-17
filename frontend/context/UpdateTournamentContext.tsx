import { createContext } from 'react';

const UpdateTournamentContext = createContext<(() => Promise<void>) | null>(null);

export default UpdateTournamentContext;
