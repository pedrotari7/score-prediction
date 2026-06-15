import Image from 'next/image';
import type { Lineup, LineupPlayer, LineupPlayers, Player, PlayersMap } from '../../interfaces/main';
import { classNames, DEFAULT_IMAGE } from '../lib/utils/reactHelper';

const LineupUnavailable = () => (
	<div
		className={
			'flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-8 text-sm shadow-panel sm:text-base'
		}
	>
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
				className={classNames(
					'flex items-center rounded-lg p-1 transition-colors duration-150 hover:bg-white/5',
					reverse ? 'justify-start sm:flex-row-reverse' : 'flex-row'
				)}
			>
				<div className='mx-2 w-4 text-center text-xs font-semibold text-light/50'>{player.number}</div>
				<div className='mx-2 w-6 rounded bg-white/5 text-center text-xs font-semibold text-light/60'>
					{player.pos}
				</div>
				<Image
					className='m-2 size-6 rounded-full object-cover ring-1 ring-white/10 sm:size-10'
					src={url}
					width={40}
					height={40}
					alt=''
				/>
				<div className='mx-2'>{player.name}</div>
			</div>
		);
	};

	const Lineup = ({ lineup, isHomeTeam = false }: { lineup: Lineup; isHomeTeam?: boolean }) => {
		return (
			<div className='flex flex-1 flex-col rounded-2xl border border-white/10 bg-white/5 p-3 shadow-panel sm:p-4'>
				<div className='mb-3 text-center'>
					<div className='text-base font-bold sm:text-lg'>{lineup.team.name}</div>
					<div className='text-xs font-semibold uppercase tracking-widest text-light/50'>
						{lineup.formation}
					</div>
				</div>

				<div className='flex flex-col items-center gap-2 rounded-lg bg-white/5 p-3'>
					<Image
						className='size-8 rounded-full object-cover ring-1 ring-white/10 sm:size-10'
						src={lineup.coach.photo}
						width={40}
						height={40}
						alt=''
					/>
					<div className='text-sm'>{lineup.coach.name}</div>
				</div>

				<div className='mt-3'>
					<div className='mb-1 text-center text-xs font-semibold uppercase tracking-widest text-light/50'>
						Bench
					</div>
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
			return XI.reduce(
				(secs, { player }) => {
					const [i, j] = player.grid.split(':').map(c => parseInt(c));
					if (!(i in secs)) secs[i] = [];
					secs[i].push([j, player]);
					secs[i].sort();
					return secs;
				},
				{} as Record<number, [number, LineupPlayer][]>
			);
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
							<Image
								className='my-1 size-6 rounded-full object-cover ring-1 ring-white/20 sm:size-8 lg:size-12 xl:size-16'
								src={url}
								width={64}
								height={64}
								alt=''
							/>
							<div className='absolute -left-4 top-1/2 w-3 text-center text-xs text-light/50 lg:-left-6 lg:text-base'>
								{player.number}
							</div>
							<div className='absolute left-1/2 -translate-x-1/2'>
								<div className='flex flex-row'>
									<div className='rounded bg-gray-900/70 px-1 py-0.5 xl:hidden'>{shortName}</div>
									<div className='hidden w-max rounded bg-gray-900/70 px-1.5 py-0.5 xl:block'>
										{player.name}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		};

		const sectionXI = (section: [number, LineupPlayer][], idx: number) => (
			<div key={idx} className='mx-1 flex grow flex-row items-center justify-evenly sm:flex-col'>
				{section.map(([_, player]: [number, LineupPlayer]) => (
					<PlayerPosition key={player.id} player={player} playerInfo={players?.[player.id]} />
				))}
			</div>
		);

		return (
			<div
				className={classNames(
					'relative flex flex-row justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5',
					className
				)}
			>
				<Image
					src='/area_horizontal.svg'
					className='hidden size-full opacity-10 sm:block'
					width={600}
					height={400}
					alt=''
				/>
				<Image src='/area.svg' className='size-full opacity-10 sm:hidden' width={400} height={600} alt='' />
				<div className='absolute size-full'>
					<div className='flex size-full flex-col items-center justify-center sm:flex-row'>
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
		<div className='flex flex-col gap-3 text-sm sm:text-base'>
			<LineupField className='' homeXI={homeLineup.startXI} awayXI={awayLineup.startXI} />
			<div className='flex flex-col justify-evenly gap-3 sm:flex-row'>
				<Lineup lineup={homeLineup} isHomeTeam />
				<Lineup lineup={awayLineup} />
			</div>
		</div>
	);
};

export default GameLineup;
