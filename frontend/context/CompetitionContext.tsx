import { createContext } from 'react';
import { Competition } from '../../interfaces/main';
import { currentCompetition } from '../../shared/utils';

const CompetitionContext = createContext<Competition>(currentCompetition);

export default CompetitionContext;
