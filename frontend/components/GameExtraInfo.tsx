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

const NavOption = ({ option, active, onClick }: { option: GamePanel; active: boolean; onClick: () => void }) => {
	const { gcc } = useCompetition();
	return (
		<div
			onClick={onClick}
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

const PanelComponent = ({
	panelMode,
	game,
	extraInfo,
	players,
}: {
	panelMode: GamePanel;
	game: Fixture;
	extraInfo: NonNullable<ReturnType<typeof useFixtureExtraInfo>['extraInfo']>;
	players: PlayersMap;
}) => {
	const colors = extraInfo?.lineups?.map(l => l.team.colors.player.primary) ?? [];
	switch (panelMode) {
		case GamePanel.Facts:
			return <GameFacts game={game} extraInfo={extraInfo} players={players} />;
		case GamePanel.Lineup:
			return <GameLineup lineups={extraInfo?.lineups ?? []} players={players} />;
		case GamePanel.Stats:
			return <GameStats stats={extraInfo?.statistics} colors={colors} />;
		default:
			return <></>;
	}
};

const GameExtraInfo = ({ game }: { game: Fixture }) => {
	const [panelMode, setPanelMode] = useState(GamePanel.Facts);

	const options = [GamePanel.Facts, GamePanel.Lineup, GamePanel.Stats];

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

	return (
		<>
			<div className='flex flex-row items-center justify-center'>
				{options.map((option, idx) => (
					<NavOption
						key={idx}
						active={panelMode === option}
						option={option}
						onClick={() => setPanelMode(option)}
					/>
				))}
			</div>
			<PanelComponent panelMode={panelMode} game={game} extraInfo={extraInfo} players={players} />
		</>
	);
};

export default GameExtraInfo;
