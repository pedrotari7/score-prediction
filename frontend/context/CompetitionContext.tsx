import { createContext } from 'react';
import { Competition } from '../../interfaces/main';
import { competitions } from '../../shared/utils';

const CompetitionContext = createContext<Competition>(competitions.euro2024);

export default CompetitionContext;
