import { createContext } from 'react';
import { Competition } from '../../interfaces/main';
import { competitions } from '../../shared/utils';

const CompetitionContext = createContext<Competition>(competitions.wc2022);

export default CompetitionContext;
