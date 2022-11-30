import { useCallback, useContext, useEffect, useState } from 'react';
import { Status } from '../../interfaces/main';
import UserContext from '../context/UserContext';
import { fetchStatus } from '../pages/api';

const useStatus = () => {
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState<Status>();
	const userInfo = useContext(UserContext);

	const update = useCallback(async () => {
		setLoading(true);
		if (userInfo) {
			setStatus(await fetchStatus(userInfo?.token));
		}
		setLoading(false);
	}, [userInfo]);

	useEffect(() => {
		update();
	}, [update]);

	return { update, status, loading };
};

export default useStatus;
