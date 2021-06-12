import { useState } from 'react';
import { Fixture } from '../../interfaces/main';
import { classNames } from '../lib/utils/reactHelper';
import GameFacts from './GameFacts';
import GameLineup from './GameLineup';

enum GamePanel {
	Facts = 'Facts',
	Lineup = 'Lineup',
}

const GameExtraInfo = ({ game }: { game: Fixture }) => {
	const [panelMode, setPanelMode] = useState(GamePanel.Facts);
	const options = [GamePanel.Facts, GamePanel.Lineup];

	const NavOption = ({ option, active }: { option: GamePanel; active: boolean }) => {
		console.log(`active`, active);
		return (
			<div
				onClick={() => setPanelMode(option)}
				className={classNames(
					' m-4 py-2 px-4 rounded-md',
					'hover:bg-opacity-50 cursor-pointer',
					active ? 'bg-blue' : 'bg-gray-700'
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
				return <GameLineup lineups={game.lineups} />;
			default:
				return <></>;
		}
	};

	return (
		<>
			<div className="flex">
				{options.map(option => (
					<NavOption active={panelMode === option} option={option} />
				))}
			</div>
			<PanelComponent />
		</>
	);
};

export default GameExtraInfo;
