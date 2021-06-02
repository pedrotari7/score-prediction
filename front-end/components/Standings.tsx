import { DateTime } from 'luxon';
import React from 'react';
import { Fixture, Fixtures } from './Fixtures';

const Match = ({ game }: { game: Fixture }) => {
	return (
		<div className="text-light flex flex-row items-center justify-evenly rounded p-2">
			<div className="flex flex-row items-center justify-end w-4/12">
				<span className="invisible sm:visible mr-2">{game?.teams.home.name}</span>
				<div className="w-5 h-5 flex items-center justify-center">
					<img className="object-cover w-full" src={game?.teams.home.logo} />
				</div>
			</div>

			<span className="text-xs w-4/12">{DateTime.fromISO(game?.fixture.date).toFormat('dd LLL HH:mm')}</span>

			<div className="flex flex-row items-center justify-start w-4/12">
				<div className="w-5 h-5 flex items-center justify-center">
					<img className="object-cover w-full" src={game?.teams.away.logo} />
				</div>
				<span className="invisible sm:visible ml-2">{game?.teams.away.name}</span>
			</div>
		</div>
	);
};

const Standings = ({ standings, fixtures }: { standings: [string, any][]; fixtures: Fixtures }) => {
	return (
		<div className="flex flex-row flex-wrap justify-center">
			{standings.map(([title, standing]) => {
				const group = title.split(' ').pop();
				console.log(`group`, group);

				const games = Object.values(fixtures).filter(f => f.league.round.startsWith(`Group ${group}`));

				console.log(`games`, games);

				return (
					<div key={title} className="m-8 p-10 shadow-pop rounded-md text-center flex flex-col bg-dark">
						<h2 className="text-4xl text-light mb-4 text-left">{title}</h2>
						<table className="text-light">
							<thead>
								<tr className="text-center">
									<th></th>
									<th></th>

									<th>Pld</th>
									<th>W</th>
									<th>D</th>
									<th>L</th>
									<th>GF</th>
									<th>GA</th>
									<th>GD</th>
									<th>Pts</th>
								</tr>
							</thead>

							<tbody>
								{standing.map((place: any) => {
									return (
										<tr key={place.rank} className="">
											<td className="mr">
												<img className="object-cover h-3 w-5 mr-2" src={place.team.logo} />
											</td>
											<td className="">
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
										</tr>
									);
								})}
							</tbody>
						</table>
						<div className="mt-4">
							{games.map(game => (
								<Match game={game} />
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default Standings;
