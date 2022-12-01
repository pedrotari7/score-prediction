import { useCallback, useContext, useEffect, useState } from 'react';
import RouteContext, { Route } from '../context/RouteContext';
import UserContext from '../context/UserContext';
import { fetchUsers } from '../pages/api';
import useCompetition from './useCompetition';

const useUsers = () => {
	const [users, setUsers] = useState<any>();
	const [loading, setLoading] = useState<boolean>(true);
	const userInfo = useContext(UserContext);
	const { competition } = useCompetition();
	const routeInfo = useContext(RouteContext);

	const update = useCallback(async () => {
		setLoading(true);
		if (userInfo) {
			const result = await fetchUsers(userInfo.token, competition);
			if (!result.success) {
				routeInfo?.setRoute({ page: Route.RefreshPage });
				return;
			}
			setUsers(result.data);
		}
		setLoading(false);
	}, [userInfo, competition]);

	useEffect(() => {
		update();
	}, [update]);

	return { users, loading, update };
};

export default useUsers;
