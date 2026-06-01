import { useCallback, useEffect, useState } from 'react';
import { Route, useTournamentStore } from '../store/tournamentStore';
import { fetchUsers } from '../pages/api';
import useCompetition from './useCompetition';
import type { AuthenticatedUser } from '../../interfaces/main';

const useUsers = () => {
	const [users, setUsers] = useState<AuthenticatedUser[]>();
	const [loading, setLoading] = useState<boolean>(true);
	const token = useTournamentStore(s => s.token);
	const { competition } = useCompetition();
	const setRoute = useTournamentStore(s => s.setRoute);

	const update = useCallback(async () => {
		setLoading(true);
		if (token) {
			const result = await fetchUsers(token, competition);
			if (!result.success) {
				setRoute({ page: Route.RefreshPage });
				return;
			}
			setUsers(result.data);
		}
		setLoading(false);
	}, [token, competition, setRoute]);

	useEffect(() => {
		update();
	}, [update]);

	return { users, loading, update };
};

export default useUsers;
