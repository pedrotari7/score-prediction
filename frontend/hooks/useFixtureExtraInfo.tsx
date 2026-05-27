import { useCallback, useEffect, useState } from 'react';
import { Fixture, FixtureExtraInfo } from '../../interfaces/main';
import { useTournamentStore } from '../store/tournamentStore';
import { fetchFixtureExtraInfo } from '../pages/api';
import useCompetition from './useCompetition';
import { isGameFinished } from '../../shared/utils';

const extraInfoCache = new Map<number, FixtureExtraInfo>();

const useFixtureExtraInfo = (game: Fixture) => {
	const { competition } = useCompetition();
	const [loading, setLoading] = useState(false);
	const token = useTournamentStore(s => s.token);
	const gameFinished = isGameFinished(game);
	const [extraInfo, setExtraInfo] = useState<FixtureExtraInfo | undefined>(() =>
		gameFinished ? extraInfoCache.get(game.fixture.id) : undefined
	);

	const update = useCallback(async () => {
		if (gameFinished && extraInfoCache.has(game.fixture.id)) {
			setExtraInfo(extraInfoCache.get(game.fixture.id));
			return;
		}
		setLoading(true);
		if (token) {
			const extra = await fetchFixtureExtraInfo(game.fixture.id, token, competition);
			if (extra) {
				if (gameFinished) extraInfoCache.set(game.fixture.id, extra);
				setExtraInfo(extra);
			}
		}
		setLoading(false);
	}, [token, game.fixture.id, gameFinished, competition]);

	useEffect(() => {
		update();
	}, [update]);

	return { loading, extraInfo, update };
};

export default useFixtureExtraInfo;
