import { useTournamentStore } from '../store/tournamentStore';
import { getCompetitionClass } from '../lib/utils/reactHelper';

const useCompetition = () => {
	const competition = useTournamentStore(s => s.competition);

	const gcc = (p?: string) => getCompetitionClass(competition, p);

	return { gcc, competition };
};

export default useCompetition;
