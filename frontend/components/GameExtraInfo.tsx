import { useState } from 'react';
import { Fixture, Player, PlayerInfo, PlayersMap } from '../../interfaces/main';
import { classNames } from '../lib/utils/reactHelper';
import GameFacts from './GameFacts';
import GameLineup from './GameLineup';
import GameStats from './GameStats';

enum GamePanel {
	Facts = 'Facts',
	Lineup = 'Lineup',
	Stats = 'Stats',
}

const GameExtraInfo = ({ game }: { game: Fixture }) => {
	const [panelMode, setPanelMode] = useState(GamePanel.Facts);
	const options = [GamePanel.Facts, GamePanel.Lineup, GamePanel.Stats];

	const players = game.players?.reduce(
		(acc, { team, players }) => ({
			...acc,
			[team.id]: players.reduce((pls, { player }) => ({ ...pls, [player.id]: player }), {}),
		}),
		{} as PlayersMap
	);

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
				return <GameFacts game={game} />;
			case GamePanel.Lineup:
				return <GameLineup lineups={game.lineups} players={players} />;
			case GamePanel.Stats:
				return <GameStats stats={game.statistics} />;
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
