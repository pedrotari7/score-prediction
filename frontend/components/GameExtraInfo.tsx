import { useContext, useEffect, useState } from 'react';
import { Fixture, FixtureExtraInfo, PlayersMap } from '../../interfaces/main';
import UserContext from '../context/UserContext';
import useCompetition from '../hooks/useCompetition';
import { classNames } from '../lib/utils/reactHelper';
import { fetchFixtureExtraInfo } from '../pages/api';
import GameFacts from './GameFacts';
import GameLineup from './GameLineup';
import GameStats from './GameStats';
import Loading from './Loading';

enum GamePanel {
	Facts = 'Facts',
	Lineup = 'Lineup',
	Stats = 'Stats',
}

const GameExtraInfo = ({ game }: { game: Fixture }) => {
	const [panelMode, setPanelMode] = useState(GamePanel.Facts);
	const [extraInfo, setExtraInfo] = useState<FixtureExtraInfo>();

	const options = [GamePanel.Facts, GamePanel.Lineup, GamePanel.Stats];

	const { token } = useContext(UserContext)!;
	const { gcc, competition } = useCompetition();

	useEffect(() => {
		const doAsync = async () => {
			const extra = await fetchFixtureExtraInfo(game.fixture.id, token, competition);
			setExtraInfo(extra);
		};

		doAsync();
	}, [game.fixture.id, token, competition]);

	if (!extraInfo) return <Loading />;

	const players =
		extraInfo?.players?.reduce(
			(acc, { players }) => ({
				...acc,
				...players.reduce((pls, { player }) => ({ ...pls, [player.id]: player }), {}),
			}),
			{} as PlayersMap
		) ?? {};

	const colors = extraInfo?.lineups?.map(l => l.team.colors.player.primary) ?? [];

	const NavOption = ({ option, active }: { option: GamePanel; active: boolean }) => {
		return (
			<div
				onClick={() => setPanelMode(option)}
				className={classNames(
					gcc('hover:bg-light'),
					active ? gcc('bg-dark') : '',
					'my-4 mx-2 rounded-md py-2 px-4 sm:mx-4',
					'cursor-pointer hover:bg-opacity-50'
				)}
			>
				{option}
			</div>
		);
	};

	const PanelComponent = () => {
		switch (panelMode) {
			case GamePanel.Facts:
				return <GameFacts game={game} extraInfo={extraInfo!} players={players} />;
			case GamePanel.Lineup:
				return <GameLineup lineups={extraInfo?.lineups ?? []} players={players} />;
			case GamePanel.Stats:
				return <GameStats stats={extraInfo?.statistics} colors={colors} />;
			default:
				return <></>;
		}
	};

	return (
		<>
			<div className='flex flex-row items-center justify-center'>
				{options.map((option, idx) => (
					<NavOption key={idx} active={panelMode === option} option={option} />
				))}
			</div>
			<PanelComponent />
		</>
	);
};

export default GameExtraInfo;
