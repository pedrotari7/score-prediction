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
		<button
			onClick={onClick}
			className={classNames(
				'mx-0.5 cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 sm:px-5 sm:text-base',
				active
					? classNames(gcc('bg-blue'), 'text-white shadow-pop')
					: 'text-light/60 hover:bg-white/10 hover:text-white'
			)}
		>
			{option}
		</button>
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
			<div className='flex flex-row items-center justify-center py-3'>
				<div className='flex flex-row rounded-full bg-white/5 p-1'>
					{options.map((option, idx) => (
						<NavOption
							key={idx}
							active={panelMode === option}
							option={option}
							onClick={() => setPanelMode(option)}
						/>
					))}
				</div>
			</div>
			<div key={panelMode} className='animate-fade-in'>
				<PanelComponent panelMode={panelMode} game={game} extraInfo={extraInfo} players={players} />
			</div>
		</>
	);
};

export default GameExtraInfo;
