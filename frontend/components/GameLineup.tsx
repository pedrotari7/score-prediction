import { Lineup, LineupPlayer, LineupPlayers, Player, PlayersMap } from '../../interfaces/main';
import { classNames, DEFAULT_IMAGE } from '../lib/utils/reactHelper';

const LineupUnavailable = () => (
	<div className={'flex flex-col items-center rounded-md bg-gray-700 p-8 text-sm sm:text-base'}>
		{' '}
		Lineups Unavailable
	</div>
);

const GameLineup = ({ lineups, players }: { lineups: Lineup[]; players: PlayersMap }) => {
	if (!lineups || !players) return <LineupUnavailable />;

	const [homeLineup, awayLineup] = lineups;

	if (!homeLineup || !awayLineup) return <LineupUnavailable />;

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
				className={classNames('flex items-center', reverse ? 'justify-start sm:flex-row-reverse' : 'flex-row')}
			>
				<div className='mx-2 w-4 text-center'>{player.number}</div>
				<div className='mx-2 w-4 text-center'>{player.pos}</div>
				<img className='m-2 h-6 w-6 rounded-full object-cover sm:h-10 sm:w-10' src={url} />
				<div className='mx-2'>{player.name}</div>
			</div>
		);
	};

	const Lineup = ({ lineup, isHomeTeam = false }: { lineup: Lineup; isHomeTeam?: boolean }) => {
		return (
			<div className='mt-2'>
				<div className='mb-2 text-center text-lg font-bold'>
					{lineup.team.name} - {lineup.formation}
				</div>

				<div className='flex flex-col items-center rounded-md p-3'>
					{/* <div className="text-center mb-2 font-bold">Coach</div> */}
					<img className='my-2 h-8 w-8 rounded-full object-cover sm:h-10 sm:w-10' src={lineup.coach.photo} />
					<div>{lineup.coach.name}</div>
				</div>

				<div className='rounded-md p-3'>
					<div className='mb-2 text-center font-bold'>Bench</div>
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
					<div className='flex flex-col items-center'>
						<div className='relative'>
							<img
								className='my-1 h-6 w-6 rounded-full object-cover sm:h-8 sm:w-8 lg:h-12 lg:w-12 xl:h-16 xl:w-16'
								src={url}
							/>
							<div className='absolute top-1/2 -left-4 w-3 text-center text-xs text-gray-400 lg:-left-6 lg:text-base'>
								{player.number}
							</div>
							<div className='absolute left-1/2 -translate-x-1/2 transform'>
								<div className='flex flex-row'>
									<div className='xl:hidden'>{shortName}</div>
									<div className='hidden w-max xl:block'>{player.name}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		};

		const sectionXI = (section: [number, LineupPlayer][], idx: number) => (
			<div key={idx} className='mx-1 flex flex-grow flex-row items-center justify-evenly sm:flex-col'>
				{section.map(([_, player]: [number, LineupPlayer]) => (
					<PlayerPosition key={player.id} player={player} playerInfo={players?.[player.id]} />
				))}
			</div>
		);

		return (
			<div className={classNames('relative flex flex-row justify-center', className)}>
				<img src='/area_horizontal.svg' className=' hidden h-full w-full opacity-10 sm:block' />
				<img src='/area.svg' className='h-full w-full opacity-10 sm:hidden' />
				<div className='absolute h-full w-full'>
					<div className='flex h-full w-full flex-col items-center justify-center sm:flex-row'>
						<div className='flex h-1/2 w-full flex-col sm:h-full sm:w-1/2 sm:flex-row'>
							{Object.values(homeSections).map((s, idx) => sectionXI(s, idx))}
						</div>
						<div className='flex h-1/2 w-full flex-col sm:h-full sm:w-1/2 sm:flex-row'>
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
		<div className='flex flex-col rounded-md bg-gray-700 p-2 text-sm sm:text-base '>
			<LineupField className='' homeXI={homeLineup.startXI} awayXI={awayLineup.startXI} />
			<div className='flex flex-col justify-evenly sm:flex-row'>
				<Lineup lineup={homeLineup} isHomeTeam />
				<Lineup lineup={awayLineup} />
			</div>
		</div>
	);
};

export default GameLineup;
