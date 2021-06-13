import { Lineup, LineupPlayer } from '../../interfaces/main';

const GameLineup = ({ lineups }: { lineups: Lineup[] }) => {
	const homeLineup = lineups[0];
	const awayLineup = lineups[1];

	const Player = ({ player }: { player: LineupPlayer }) => {
		return (
			<div className="flex flex-row">
				<div className="mx-2 w-4 text-center">{player.number}</div>
				<div className="mx-2">{player.pos}</div>
				<div className="mx-2">{player.name}</div>
			</div>
		);
	};

	const Lineup = ({ lineup }: { lineup: Lineup }) => {
		return (
			<div className="mt-2">
				<div className="text-center mb-2 font-bold text-lg">
					{lineup.team.name} - {lineup.formation}
				</div>
				<div className="shadow-panel p-3 rounded-md">
					{lineup.startXI.map(({ player }: { player: LineupPlayer }) => (
						<Player key={player.id} player={player} />
					))}
				</div>

				<div className="shadow-panel p-3 rounded-md flex flex-col items-center">
					<div className="text-center mb-2 font-bold">Coach</div>
					<img className="object-cover h-8 w-8 sm:h-12 sm:w-12 rounded-full my-2" src={lineup.coach.photo} />
					<div>{lineup.coach.name}</div>
				</div>

				<div className="shadow-panel p-3 rounded-md">
					<div className="text-center mb-2 font-bold">Bench</div>
					{lineup.substitutes.map(({ player }: { player: LineupPlayer }) => (
						<Player key={player.id} player={player} />
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="bg-gray-700 rounded-md p-2 flex flex-col sm:flex-row justify-evenly">
			<Lineup lineup={homeLineup} />
			<Lineup lineup={awayLineup} />
		</div>
	);
};

export default GameLineup;
