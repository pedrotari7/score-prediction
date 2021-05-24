const Standings = ({ standings }: { standings: [string, any][] }) => {
	return (
		<div>
			{standings.map(([title, standing]) => {
				return (
					<div key={title} className="ml-6 mt-6">
						<h2 className="text-4xl  text-light mb-4">{title}</h2>
						<table className="text-light">
							<thead>
								<tr className="text-left">
									<th>Pos</th>
									<th>Team</th>
									<th>Pld</th>
									<th>W</th>
									<th>D</th>
									<th>L</th>
									<th>GF</th>
									<th>GA</th>
									<th>GD</th>
									<th>Pts</th>
									<th>Description</th>
								</tr>
							</thead>

							<tbody>
								{standing.map((place: any) => {
									return (
										<tr key={place.rank}>
											<td>{place.rank}</td>
											<td className="flex flex-row items-center">
												<img className="object-cover h-3 w-5 mr-2" src={place.team.logo} />
												<span>{place.team.name}</span>
											</td>
											<td>{place.all.played}</td>
											<td>{place.all.win}</td>
											<td>{place.all.draw}</td>
											<td>{place.all.loss}</td>

											<td>{place.all.goals.for}</td>
											<td>{place.all.goals.against}</td>
											<td>{place.all.goals.for - place.all.goals.against}</td>
											<td>{place.points}</td>

											<td>{place.description}</td>
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

export default Standings;
