import { useContext } from 'react';
import type { Fixture, Fixtures, Standing, Standings } from '../../interfaces/main';
import GroupMapContext from '../context/GroupMapContext';
import useCompetition from '../hooks/useCompetition';
import { classNames, GROUP_COLORS } from '../lib/utils/reactHelper';
import Flag from './Flag';
import Panel from './Panel';
import Match from './Match';

const StandingsPage = ({ standings, fixtures }: { standings: Standings; fixtures: Fixtures }) => {
	const groupMap = useContext(GroupMapContext);
	const { gcc } = useCompetition();

	return (
		<Panel className='flex select-none flex-row flex-wrap justify-center bg-transparent'>
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
											<td className=''>
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
														'ml-2 size-3 rounded-full'
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
		</Panel>
	);
};

export default StandingsPage;
