import { Lineup, LineupPlayer, LineupPlayers, Player, PlayersInfo } from '../../interfaces/main';
import { classNames } from '../lib/utils/reactHelper';

const GameLineup = ({ lineups, players }: { lineups: Lineup[]; players: PlayersInfo[] }) => {
	const [homeLineup, awayLineup] = lineups;
	const [homePlayers, awayPlayers] = players?.map(p =>
		p.players.reduce((acc, { player }) => ({ ...acc, [player.id]: player }), {})
	) ?? [undefined, undefined];

	const Player = ({ player }: { player: LineupPlayer }) => {
		return (
			<div className="flex flex-row justify-between">
				<div className="flex flex-row">
					<div className="mx-2 w-4 text-center">{player.number}</div>
					<div className="mx-2">{player.pos}</div>
				</div>
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

				<div className="p-3 rounded-md flex flex-col items-center">
					<div className="text-center mb-2 font-bold">Coach</div>
					<img className="object-cover h-8 w-8 sm:h-12 sm:w-12 rounded-full my-2" src={lineup.coach.photo} />
					<div>{lineup.coach.name}</div>
				</div>

				<div className="p-3 rounded-md">
					<div className="text-center mb-2 font-bold">Bench</div>
					{lineup.substitutes.map(({ player }: { player: LineupPlayer }) => (
						<Player key={player.id} player={player} />
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
			}, {} as Record<number, any>);
		};

		const homeSections = createSections(homeXI);
		const awaySections = createSections(awayXI);

		const PlayerPosition = ({ player, playerInfo }: { player: LineupPlayer; playerInfo: Player }) => {
			const lastNames = player.name.split(' ').slice(1).join(' ');
			const shortName = lastNames ? lastNames : player.name;
			const url = playerInfo?.photo
				? playerInfo.photo
				: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAABYCAMAAABGS8AGAAAAkFBMVEVHcEwAAACAgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuLi5+fn5+fn5aWlp5eXliYmJoaGhtbW17e3t1dXV8fHx2dnbOzs729vaBgYHa2trv7+/W1tbx8fHR0dGQkJDd3d20tLTk5OTh4eG8vLyenp7Kysrp6enDw8OHh4etra3T09OhoaGnp6eKioqXl5eTk5MLPRlaAAAAFnRSTlMAF/EYCw4VAxIHJtTjRKpTYnC4jcabWgrxJQAABJRJREFUWMO1mXt7qjAMxkEm5xwveNkGlZsgiLe5ff9vd9ICpdCmgrj856y/J3uTpm1iGLL9ofYP7A1sOp3+lQz+SL+ja9hio5cJWAa1qZnc2EcGF9D9sQ3VnK3etx8TUtnkY/u+mpktdh90C2vb1vpzThQ2/1xblC2g+7nLsObSKR2Nv7LTrrJT9hWXrjtLs0I/dLqFtTbM1ziJfK9jfpQw+HxjtdAPuQy7YNSDh1jB2IsSrSczbok1VxSbR57WopyiV2aNRsgCd7al2F2DCIt94DKLglRQZkfR25mWzLm2uYaQxQLW37ktC0Q0CDJZg9MYueRC1GzLAS8y4T8+uJKlwtcZLHdAaYihglxxqQyQC99iyPauwsQFh2/Ij1IOidxwlxC1i6/3l1ohZt8FYrhUkTnXXIK8x1bKqrnutZUfRxB6acpkHjfgnltctRBdl4F8BjKPoJLb2REY1+2sOyjItRD2bCFxfRQceBJ5MbNbYtRca97Rl25cFHzt7kPQeW7V5EYICJwjc70UBbueguxAAGsxuBBryDNvDNiDrFs3YnCBJ+Rbqo8ajRVg/5tMuMwUTDPChLqjKJH9g8cCCBXJZJlBwaXDq3Z9eA5M68aqctkoHbYWJFbW3GFgLyYLq3TZKB3eELJTrgyGgXeEbEqXSzA4nKtPiR0GTtXr89JlCtY6jOcbAuYuM7A5xxwOUSmiEHN5bjIwbDp7SUg00GHX3SMnLCFQjN7eDKqEg6SEJnZY9GhiOFQLCrYmJPEGxg4HJ2RiMTCrEgWySrOlsZ8cWMV4M0CJT1QJjch79Ccx+QQtDJYTCboqxMAh+pOE5YUxtWdoTmhUDjQ3L0Jm9tRg9cfHlxXDFKZxYZUIwO8aiakDQ7ZHJfI7A2/Jlw58GBY6sC+aycZf80NZifXh0zkMVfmDgSfkpL0G7wc67J3IxKRgtLLhm6TQ/gAqHAVbj8DeQCX6g6VK9OAJUYFnD8HSHtm9CBx2nwqh9xopuuErvF8C+/3AeLqFfpoGQXBNu+D0Cn9OUz/Ug5UbJEyDpkh0tkjzEV59Ib5BFFva15x1UgH1kS0NR2mnCIUHd5DtQ2URksqmf3UH2tVXls1OoS8id7BFhVzou0dT6j5lqXQ0dQ7Tvfuk7aXDVDz+w8B92vhGr47/8sJyGM3l5KK6sAhXrHHcmsyvWPxS6EfuSGNtKX4prK+x47mMzK+x9cX7FVxK5hfv+qnwEi6Qm6dC9bhJXgNOmsdN5fL9NeA7f47xB+TlFdxL84DkT97zaTz3dBaevPyR/jMe/CM+0pu2wmW8EK22Am+EnLNx3OwsNkLE1s39OIZ7vLdaN61mU3zETma0DDfcuNNsarXH8uZ87Af2whqdS+2xVkMv58duT7BXofNHrcL8WJ3mvcEUfVRy1U3TAWC0aaps8/YH421eZWO6N1jXmFa10vuC9a10RfO/H/hh818eVyT96vrDcYU8YLk/RCf3PgMWxUjofNPU6NPt3HMkpBxixTdlyctu8YAhFjZ2+7klGXf9lCW3n6Fjt98bFGKjTUccbTpPjTZ/bxj7qvHxf74hHX2Bfx7wAAAAAElFTkSuQmCC';
			return (
				<div className={classNames('rounded-md text-xs')}>
					<div className="flex flex-col items-center">
						<div className="relative">
							<img
								className="object-cover h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 xl:h-20 xl:w-20 rounded-full my-1"
								src={url}
							/>
							<div className="absolute w-3 text-center top-1/2 -left-4 lg:-left-6 text-xs lg:text-base text-gray-400">
								{player.number}
							</div>
							<div className="absolute left-1/2 transform -translate-x-1/2">
								<div className="flex flex-row">
									<div className="xl:hidden">{shortName}</div>
									<div className="hidden xl:block">{player.name}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		};

		const sectionXI = (section: [number, LineupPlayer][], idx: number, playersInfo: Record<number, Player>) => (
			<div key={idx} className="flex flex-row sm:flex-col flex-grow items-center justify-evenly mx-1">
				{section.map(([_, player]: [number, LineupPlayer]) => (
					<PlayerPosition key={player.id} player={player} playerInfo={playersInfo?.[player.id]} />
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
							{Object.values(homeSections).map((s, idx) => sectionXI(s, idx, homePlayers))}
						</div>
						<div className="sm:w-1/2 w-full h-1/2 sm:h-full flex flex-col sm:flex-row">
							{Object.values(awaySections)
								.reverse()
								.map((s, idx) => sectionXI(s, idx, awayPlayers))}
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
				<Lineup lineup={homeLineup} />
				<Lineup lineup={awayLineup} />
			</div>
		</div>
	);
};

export default GameLineup;
