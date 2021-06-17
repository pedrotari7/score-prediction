import { useContext, useEffect, useState } from 'react';
import { Fixture, FixtureExtraInfo, PlayersMap } from '../../interfaces/main';
import UserContext from '../context/UserContext';
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

	useEffect(() => {
		const doAsync = async () => {
			const extra = await fetchFixtureExtraInfo(game.fixture.id, token);
			setExtraInfo(extra);
		};

		doAsync();
	}, []);

	if (!extraInfo) return <Loading />;

	const players = extraInfo?.players?.reduce(
		(acc, { team, players }) => ({
			...acc,
			[team.id]: players.reduce((pls, { player }) => ({ ...pls, [player.id]: player }), {}),
		}),
		{} as PlayersMap
	);

	const colors = extraInfo?.lineups?.map(l => l.team.colors.player.primary) ?? [];

	const NavOption = ({ option, active }: { option: GamePanel; active: boolean }) => {
		return (
			<div
				onClick={() => setPanelMode(option)}
				className={classNames(
					'my-4 mx-2 sm:mx-4 py-2 px-4 rounded-md',
					'hover:bg-opacity-50 cursor-pointer',
					'hover:bg-light',
					active ? 'bg-blue' : ''
				)}>
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
			<div className="flex flex-row items-center justify-center">
				{options.map((option, idx) => (
					<NavOption key={idx} active={panelMode === option} option={option} />
				))}
			</div>
			<PanelComponent />
		</>
	);
};

export default GameExtraInfo;
