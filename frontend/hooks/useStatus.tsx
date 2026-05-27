import { useCallback, useEffect, useState } from 'react';
import { Status } from '../../interfaces/main';
import { useTournamentStore } from '../store/tournamentStore';
import { fetchStatus } from '../pages/api';

const useStatus = () => {
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState<Status>();
	const token = useTournamentStore(s => s.token);

	const [trigger, setTrigger] = useState(false);

	const updateStatus = useCallback(() => {
		setTrigger(v => !v);
	}, [setTrigger]);

	const update = useCallback(async () => {
		setLoading(true);
		if (token) {
			setStatus(await fetchStatus(token));
		}
		setLoading(false);
	}, [token]);

	useEffect(() => {
		update();
	}, [update, trigger]);

	return { update, status, loading, updateStatus };
};

export default useStatus;
