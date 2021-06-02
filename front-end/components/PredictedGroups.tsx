import React from 'react';
import { Fixtures } from './Fixtures';

const PredictedGroups = ({ standings, fixtures }: { standings: [string, any][]; fixtures: Fixtures }) => {
	return (
		<div className="flex flex-row flex-wrap justify-center">
			{standings.map(([title, standing]) => {
				const group = title.split(' ').pop();

				if (group?.length !== 1) return null;

				return (
					<div key={title} className="m-8 p-10 shadow-pop rounded-md text-center flex flex-col bg-dark ">
						<h2 className="text-2xl text-light mb-4 text-left">{title}</h2>
						<table className="text-light">
							<thead>
								<tr className="text-center">
									<th></th>
									{/* <th></th> */}

									<th>G</th>
									<th>W</th>
									<th>D</th>
									<th>L</th>

									<th>P</th>
									<th>Real</th>
								</tr>
							</thead>

							<tbody>
								{standing.map((place: any) => {
									return (
										<tr key={place.rank} className="">
											<td className="mr">
												<img className="object-cover h-3 w-5 mr-2" src={place.team.logo} />
											</td>
											{/* <td className="">
												<span className="hidden md:flex">{place.team.name}</span>
											</td> */}

											<td className="w-6">{place.all.played}</td>
											<td className="w-6">{place.all.win}</td>
											<td className="w-6">{place.all.draw}</td>
											<td className="w-6">{place.all.lose}</td>

											<td className="w-6">{place.points}</td>
											<td className="ml-2">
												<img className="object-cover h-3 w-5 ml-2" src={place.team.logo} />
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				);
			})}
		</div>
	);
};

export default PredictedGroups;
