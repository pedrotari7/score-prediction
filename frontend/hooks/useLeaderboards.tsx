import { useCallback, useContext, useEffect, useState } from 'react';
import { Leaderboard } from '../../interfaces/main';
import UserContext from '../context/UserContext';
import { fetchLeaderboards } from '../pages/api';

const useLeaderboards = () => {
	const [loading, setLoading] = useState(false);
	const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
	const userInfo = useContext(UserContext);

	const update = useCallback(async () => {
		setLoading(true);
		if (userInfo) {
			setLeaderboards(await fetchLeaderboards(userInfo.token));
		}
		setLoading(false);
	}, [userInfo]);

	useEffect(() => {
		update();
	}, [update]);

	return { update, leaderboards, loading };
};

export default useLeaderboards;
