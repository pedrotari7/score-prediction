import { useContext } from 'react';
import CompetitionContext from '../context/CompetitionContext';
import { getCompetitionClass } from '../lib/utils/reactHelper';

const useCompetition = () => {
	const competition = useContext(CompetitionContext);

	const gcc = (p?: string) => getCompetitionClass(competition, p);

	return { gcc, competition };
};

export default useCompetition;
