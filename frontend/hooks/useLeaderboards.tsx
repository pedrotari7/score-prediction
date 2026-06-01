import { useCallback, useEffect, useState } from 'react';
import type { Leaderboard } from '../../interfaces/main';
import { Route, useTournamentStore } from '../store/tournamentStore';
import { fetchLeaderboards } from '../pages/api';

const useLeaderboards = () => {
	const [loading, setLoading] = useState(true);
	const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
	const token = useTournamentStore(s => s.token);
	const setRoute = useTournamentStore(s => s.setRoute);

	const update = useCallback(async () => {
		setLoading(true);

		if (token) {
			const result = await fetchLeaderboards(token);
			if (!result.success) {
				setRoute({ page: Route.RefreshPage });
				return;
			}
			setLeaderboards(result.data);
		}

		setLoading(false);
	}, [token, setRoute]);

	useEffect(() => {
		update();
	}, [update]);

	return { update, leaderboards, loading };
};

export default useLeaderboards;
