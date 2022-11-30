import { useCallback, useContext, useEffect, useState } from 'react';
import UserContext from '../context/UserContext';
import { fetchUsers } from '../pages/api';
import useCompetition from './useCompetition';

const useUsers = () => {
	const [users, setUsers] = useState<any>();
	const [loading, setLoading] = useState<boolean>(true);
	const userInfo = useContext(UserContext);
	const { competition } = useCompetition();

	const update = useCallback(async () => {
		setLoading(true);
		if (userInfo) {
			setUsers(await fetchUsers(userInfo.token, competition));
		}
		setLoading(false);
	}, [userInfo, competition]);

	useEffect(() => {
		update();
	}, [update]);

	return { users, loading, update };
};

export default useUsers;
