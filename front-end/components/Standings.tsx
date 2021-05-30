const Standings = ({ standings }: { standings: [string, any][] }) => {
	return (
		<div className="flex flex-row flex-wrap justify-center">
			{standings.map(([title, standing]) => {
				return (
					<div key={title} className="m-8 p-10 shadow-pop rounded-md text-center flex flex-col">
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
					</div>
				);
			})}
		</div>
	);
};

export default Standings;
