import { Lineup, LineupPlayer, LineupPlayers, Player, PlayersMap } from '../../interfaces/main';
import { classNames, DEFAULT_IMAGE } from '../lib/utils/reactHelper';

const GameLineup = ({ lineups, players }: { lineups: Lineup[]; players: PlayersMap }) => {
	const [homeLineup, awayLineup] = lineups;

	const Player = ({
		player,
		playerInfo,
		reverse = false,
	}: {
		player: LineupPlayer;
		playerInfo: Player | undefined;
		reverse?: boolean;
	}) => {
		const url = playerInfo?.photo ? playerInfo.photo : DEFAULT_IMAGE;
		return (
			<div
				className={classNames('flex items-center', reverse ? 'sm:flex-row-reverse justify-start' : 'flex-row')}>
				<div className="mx-2 w-4 text-center">{player.number}</div>
				<div className="mx-2 w-4 text-center">{player.pos}</div>
				<img className="object-cover h-6 w-6 sm:h-10 sm:w-10 rounded-full m-2" src={url} />
				<div className="mx-2">{player.name}</div>
			</div>
		);
	};

	const Lineup = ({ lineup, isHomeTeam = false }: { lineup: Lineup; isHomeTeam?: boolean }) => {
		return (
			<div className="mt-2">
				<div className="text-center mb-2 font-bold text-lg">
					{lineup.team.name} - {lineup.formation}
				</div>

				<div className="p-3 rounded-md flex flex-col items-center">
					{/* <div className="text-center mb-2 font-bold">Coach</div> */}
					<img className="object-cover h-8 w-8 sm:h-10 sm:w-10 rounded-full my-2" src={lineup.coach.photo} />
					<div>{lineup.coach.name}</div>
				</div>

				<div className="p-3 rounded-md">
					<div className="text-center mb-2 font-bold">Bench</div>
					{lineup.substitutes.map(({ player }: { player: LineupPlayer }) => (
						<Player key={player.id} player={player} playerInfo={players[player.id]} reverse={isHomeTeam} />
					))}
				</div>
			</div>
		);
	};

	const LineupField = ({
		homeXI,
		awayXI,
		className,
	}: {
		homeXI: LineupPlayers;
		awayXI: LineupPlayers;
		className: string;
	}) => {
		const createSections = (XI: LineupPlayers) => {
			return XI.reduce((secs, { player }) => {
				const [i, j] = player.grid.split(':').map(c => parseInt(c));
				if (!(i in secs)) secs[i] = [];
				secs[i].push([j, player]);
				secs[i].sort();
				return secs;
			}, {} as Record<number, [number, LineupPlayer][]>);
		};

		const homeSections = createSections(homeXI);
		const awaySections = createSections(awayXI);

		const PlayerPosition = ({ player, playerInfo }: { player: LineupPlayer; playerInfo: Player | undefined }) => {
			const lastNames = player.name.split(' ').slice(1).join(' ');
			const shortName = lastNames || player.name;
			const url = playerInfo?.photo ? playerInfo.photo : DEFAULT_IMAGE;
			return (
				<div className={classNames('rounded-md text-xs')}>
					<div className="flex flex-col items-center">
						<div className="relative">
							<img
								className="object-cover h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 xl:h-16 xl:w-16 rounded-full my-1"
								src={url}
							/>
							<div className="absolute w-3 text-center top-1/2 -left-4 lg:-left-6 text-xs lg:text-base text-gray-400">
								{player.number}
							</div>
							<div className="absolute left-1/2 transform -translate-x-1/2">
								<div className="flex flex-row">
									<div className="xl:hidden">{shortName}</div>
									<div className="hidden xl:block w-max">{player.name}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		};

		const sectionXI = (section: [number, LineupPlayer][], idx: number) => (
			<div key={idx} className="flex flex-row sm:flex-col flex-grow items-center justify-evenly mx-1">
				{section.map(([_, player]: [number, LineupPlayer]) => (
					<PlayerPosition key={player.id} player={player} playerInfo={players?.[player.id]} />
				))}
			</div>
		);

		return (
			<div className={classNames('flex flex-row justify-center relative', className)}>
				<img src="/area_horizontal.svg" className=" hidden sm:block opacity-10 w-full h-full" />
				<img src="/area.svg" className="sm:hidden opacity-10 w-full h-full" />
				<div className="absolute w-full h-full">
					<div className="flex flex-col sm:flex-row w-full h-full justify-center items-center">
						<div className="sm:w-1/2 w-full h-1/2 sm:h-full flex flex-col sm:flex-row">
							{Object.values(homeSections).map((s, idx) => sectionXI(s, idx))}
						</div>
						<div className="sm:w-1/2 w-full h-1/2 sm:h-full flex flex-col sm:flex-row">
							{Object.values(awaySections)
								.reverse()
								.map((s, idx) => sectionXI(s, idx))}
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="bg-gray-700 rounded-md p-2 flex flex-col text-sm sm:text-base ">
			<LineupField className="" homeXI={homeLineup.startXI} awayXI={awayLineup.startXI} />
			<div className="flex flex-col sm:flex-row justify-evenly">
				<Lineup lineup={homeLineup} isHomeTeam />
				<Lineup lineup={awayLineup} />
			</div>
		</div>
	);
};

export default GameLineup;
