import { useCallback, useContext, useEffect, useState } from 'react';
import { Fixture, FixtureExtraInfo } from '../../interfaces/main';
import UserContext from '../context/UserContext';
import { fetchFixtureExtraInfo } from '../pages/api';
import useCompetition from './useCompetition';

const useFixtureExtraInfo = (game: Fixture) => {
	const { competition } = useCompetition();
	const [loading, setLoading] = useState(false);
	const userInfo = useContext(UserContext)!;
	const [extraInfo, setExtraInfo] = useState<FixtureExtraInfo>();

	const update = useCallback(async () => {
		setLoading(true);
		if (userInfo) {
			const extra = await fetchFixtureExtraInfo(game.fixture.id, userInfo.token, competition);
			setExtraInfo(extra);
		}
		setLoading(false);
	}, [userInfo, game.fixture.id, competition]);

	useEffect(() => {
		update();
	}, [update]);

	return { loading, extraInfo, update };
};

export default useFixtureExtraInfo;
