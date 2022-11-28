import { DateTime } from 'luxon';
import { useContext } from 'react';
import { Fixture, Fixtures, Standing, Standings } from '../../interfaces/main';
import { isGameFinished } from '../../shared/utils';
import GroupMapContext from '../context/GroupMapContext';
import useCompetition from '../hooks/useCompetition';
import { classNames, GROUP_COLORS } from '../lib/utils/reactHelper';
import Flag from './Flag';

const Match = ({ game }: { game: Fixture }) => {
	const { gcc } = useCompetition();

	return (
		<div
			className={classNames(
				gcc('text-light'),
				'flex select-none flex-row items-center justify-evenly rounded p-2'
			)}
		>
			<div className='flex w-2/12 flex-row items-center justify-end sm:w-5/12'>
				<span className='mr-2 hidden text-right sm:block'>{game?.teams.home.name}</span>
				<div className='flex items-center justify-center'>
					<Flag team={game?.teams.home} />
				</div>
			</div>

			{!isGameFinished(game) && (
				<span className='w-6/12 text-xs sm:w-4/12'>
					{DateTime.fromISO(game?.fixture.date).toFormat('dd LLL HH:mm ccc')}
				</span>
			)}

			{isGameFinished(game) && (
				<span className='text-md w-6/12 font-bold sm:w-4/12'>
					<span>{game.goals.home}</span>
					<span className='mx-2'>-</span>
					<span>{game.goals.away}</span>
				</span>
			)}

			<div className='flex w-2/12 flex-row items-center justify-start sm:w-5/12'>
				<div className='flex items-center justify-center'>
					<Flag team={game?.teams.away} />
				</div>
				<span className='ml-2 hidden text-left sm:block'>{game?.teams.away.name}</span>
			</div>
		</div>
	);
};

const StandingsPage = ({ standings, fixtures }: { standings: Standings; fixtures: Fixtures }) => {
	const groupMap = useContext(GroupMapContext);
	const { gcc } = useCompetition();

	return (
		<div className='flex select-none flex-row flex-wrap justify-center'>
			{standings.map(([title, standing]) => {
				const group = title.split(' ').pop();

				const games = Object.values(fixtures)
					.filter(
						(f: Fixture) =>
							f.league.round.startsWith(`Group`) &&
							groupMap[f.teams.home.id] === group &&
							groupMap[f.teams.away.id] === group
					)
					.sort((a: Fixture, b: Fixture) => a.fixture.timestamp - b.fixture.timestamp);

				return (
					<div
						key={title}
						className={classNames(
							gcc('bg-dark'),
							`m-8 mx-4 flex flex-col rounded-md p-8 text-center font-bold shadow-pop`
						)}
					>
						<h2
							className={classNames(
								gcc('text-light'),
								GROUP_COLORS[group!],
								`mb-4 rounded-md pl-2 text-left text-4xl`
							)}
						>
							{title}
						</h2>
						<table className={classNames(gcc('text-light'))}>
							<thead>
								<tr className='text-center'>
									<th></th>
									<th></th>

									<th>G</th>
									<th>W</th>
									<th>D</th>
									<th>L</th>
									<th>GF</th>
									<th>GA</th>
									<th>GD</th>
									<th>P</th>
									<th></th>
								</tr>
							</thead>

							<tbody>
								{standing.map((place: Standing) => {
									const promotion = place.description?.includes('Promotion');
									const bestThird = place.description?.includes('third');

									return (
										<tr key={place.rank}>
											<td className='mr'>
												<Flag team={place.team} />
											</td>
											<td className='md:w-52'>
												<span className='hidden font-bold md:flex'>{place.team.name}</span>
											</td>

											<td className='w-6'>{place.all.played}</td>
											<td className='w-6'>{place.all.win}</td>
											<td className='w-6'>{place.all.draw}</td>
											<td className='w-6'>{place.all.lose}</td>

											<td className='w-6'>{place.all.goals.for}</td>
											<td className='w-6'>{place.all.goals.against}</td>
											<td className='w-6'>{place.all.goals.for - place.all.goals.against}</td>
											<td className='w-6'>{place.points}</td>
											<td>
												<div
													className={classNames(
														promotion ? 'bg-ok' : '',
														bestThird ? 'bg-warn' : '',

														'ml-2 h-3 w-3 rounded-full'
													)}
												></div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						<div className='mt-4'>
							{games.map(game => (
								<Match game={game} key={game.fixture.id} />
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default StandingsPage;
