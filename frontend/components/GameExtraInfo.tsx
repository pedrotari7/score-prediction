import { useState } from 'react';
import type { Fixture, PlayersMap } from '../../interfaces/main';
import useCompetition from '../hooks/useCompetition';
import useFixtureExtraInfo from '../hooks/useFixtureExtraInfo';
import { classNames } from '../lib/utils/reactHelper';
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

	const options = [GamePanel.Facts, GamePanel.Lineup, GamePanel.Stats];

	const { gcc } = useCompetition();

	const { extraInfo, loading } = useFixtureExtraInfo(game);

	if (loading || !extraInfo) return <Loading />;

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
				className={
					classNames(
						gcc('hover:bg-light'),
						active ? gcc('bg-dark') : '',
						'mx-2 my-4 cursor-pointer rounded-md px-4 py-2 sm:mx-4'
					) +
					' ' +
					// eslint-disable-next-line tailwindcss/migration-from-tailwind-2
					classNames('hover:bg-opacity-50')
				}
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
