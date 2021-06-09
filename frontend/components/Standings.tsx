import { DateTime } from 'luxon';
import React from 'react';
import { Fixture, Fixtures, Standing, Standings } from '../../interfaces/main';
import { classNames } from '../lib/utils/reactHelper';
import Flag from './Flag';

const Match = ({ game }: { game: Fixture }) => {
	return (
		<div className="text-light flex flex-row items-center justify-evenly rounded p-2 select-none">
			<div className="flex flex-row items-center justify-end w-4/12">
				<span className="hidden sm:block mr-2">{game?.teams.home.name}</span>
				<div className="flex items-center justify-center">
					<Flag team={game?.teams.home} />
				</div>
			</div>

			<span className="text-xs w-4/12">{DateTime.fromISO(game?.fixture.date).toFormat('dd LLL HH:mm ccc')}</span>

			<div className="flex flex-row items-center justify-start w-4/12">
				<div className="flex items-center justify-center">
					<Flag team={game?.teams.away} />
				</div>
				<span className="hidden sm:block ml-2">{game?.teams.away.name}</span>
			</div>
		</div>
	);
};

const StandingsPage = ({ standings, fixtures }: { standings: Standings; fixtures: Fixtures }) => {
	return (
		<div className="flex flex-row flex-wrap justify-cente select-noner">
			{standings.map(([title, standing]) => {
				const group = title.split(' ').pop();

				const games = Object.values(fixtures).filter(f => f.league.round.startsWith(`Group ${group}`));

				return (
					<div key={title} className="m-8 p-10 shadow-pop rounded-md text-center flex flex-col bg-dark">
						<h2 className="text-4xl text-light mb-4 text-left">{title}</h2>
						<table className="text-light">
							<thead>
								<tr className="text-center">
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
											<td className="mr">
												<Flag team={place.team} />
											</td>
											<td className="md:w-52">
												<span className="hidden md:flex">{place.team.name}</span>
											</td>

											<td className="w-6">{place.all.played}</td>
											<td className="w-6">{place.all.win}</td>
											<td className="w-6">{place.all.draw}</td>
											<td className="w-6">{place.all.lose}</td>

											<td className="w-6">{place.all.goals.for}</td>
											<td className="w-6">{place.all.goals.against}</td>
											<td className="w-6">{place.all.goals.for - place.all.goals.against}</td>
											<td className="w-6">{place.points}</td>
											<td>
												<div
													className={classNames(
														promotion ? 'bg-ok' : '',
														bestThird ? 'bg-warn' : '',

														'w-3 h-3 rounded-full ml-2'
													)}></div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						<div className="mt-4">
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
