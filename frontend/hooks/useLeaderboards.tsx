import { useCallback, useContext, useEffect, useState } from 'react';
import { Leaderboard } from '../../interfaces/main';
import RouteContext, { Route } from '../context/RouteContext';
import UserContext from '../context/UserContext';
import { fetchLeaderboards } from '../pages/api';

const useLeaderboards = () => {
	const [loading, setLoading] = useState(true);
	const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
	const userInfo = useContext(UserContext);
	const routeInfo = useContext(RouteContext);

	const update = useCallback(async () => {
		setLoading(true);

		if (userInfo) {
			const result = await fetchLeaderboards(userInfo.token);
			if (!result.success) {
				routeInfo?.setRoute({ page: Route.RefreshPage });
				return;
			}
			setLeaderboards(result.data);
		}

		setLoading(false);
	}, [userInfo]);

	useEffect(() => {
		update();
	}, [update]);

	return { update, leaderboards, loading };
};

export default useLeaderboards;
