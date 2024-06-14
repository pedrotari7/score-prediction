import { useCallback, useContext, useEffect, useState } from 'react';
import { Status } from '../../interfaces/main';
import UserContext from '../context/UserContext';
import { fetchStatus } from '../pages/api';

const useStatus = () => {
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState<Status>();
	const userInfo = useContext(UserContext);

	const [trigger, setTrigger] = useState(false);

	const updateStatus = useCallback(() => {
		setTrigger(v => !v);
	}, [setTrigger]);

	const update = useCallback(async () => {
		setLoading(true);
		if (userInfo) {
			setStatus(await fetchStatus(userInfo?.token));
		}
		setLoading(false);
	}, [userInfo]);

	useEffect(() => {
		update();
	}, [update, trigger]);

	return { update, status, loading, updateStatus };
};

export default useStatus;
