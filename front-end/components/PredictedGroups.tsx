import React, { useContext } from 'react';
import { Predictions } from '../../interfaces/main';
import UserContext from '../context/UserContext';
import { Fixtures } from './Fixtures';

interface Result {
	points: number;
	wins: number;
	draws: number;
	loses: number;
}

const intializeTeam = (): Result => ({
	points: 0,
	wins: 0,
	draws: 0,
	loses: 0,
});

const calculatePoints = ({ wins, draws }: Result) => 3 * wins + draws;

const calculateResults = (fixtures: Fixtures, predictions: Predictions, uid: string) => {
	return Object.values(fixtures).reduce((teams, game) => {
		const homeTeam = game.teams.home.id;
		const awayTeam = game.teams.away.id;

		if (!(homeTeam in teams)) teams[homeTeam] = intializeTeam();
		if (!(awayTeam in teams)) teams[awayTeam] = intializeTeam();

		const prediction = predictions?.[game.fixture.id]?.[uid];

		if (prediction?.home && prediction?.away) {
			if (prediction.home > prediction.away) {
				teams[homeTeam].wins += 1;
				teams[awayTeam].loses += 1;
			} else if (prediction?.home < prediction?.away) {
				teams[awayTeam].wins += 1;
				teams[homeTeam].loses += 1;
			} else {
				teams[homeTeam].draws += 1;
				teams[awayTeam].draws += 1;
			}
			teams[homeTeam].points = calculatePoints(teams[homeTeam]);
			teams[awayTeam].points = calculatePoints(teams[awayTeam]);
		}
		return teams;
	}, {} as Record<number, Result>);
};

const sortGroup = (group: any, teamsResults: Record<number, Result>) => {
	group.sort((a: any, b: any) => {
		return (
			teamsResults[b.team.id].points - teamsResults[a.team.id].points ||
			teamsResults[b.team.id].wins - teamsResults[a.team.id].wins ||
			teamsResults[b.team.id].draws - teamsResults[a.team.id].draws
		);
	});
	return group;
};

const PredictedGroups = ({
	standings,
	fixtures,
	predictions,
}: {
	standings: [string, any][];
	fixtures: Fixtures;
	predictions: Predictions;
}) => {
	const userInfo = useContext(UserContext);

	if (!userInfo) return <></>;

	const teamsResults = calculateResults(fixtures, predictions, userInfo.uid);

	return (
		<div className="flex flex-row flex-wrap justify-center">
			{standings.map(([title, standing]) => {
				const group = title.split(' ').pop();

				if (group?.length !== 1) return null;

				const sortedGroup = sortGroup([...standing], teamsResults);

				return (
					<div key={title} className="m-2 p-4 shadow-pop rounded-md text-center flex flex-col bg-dark ">
						<h2 className="text-2xl text-light mb-4 text-left">{title}</h2>
						<table className="text-light">
							<thead>
								<tr className="text-center">
									<th></th>

									<th>W</th>
									<th>D</th>
									<th>L</th>

									<th>P</th>
									<th>Real</th>
								</tr>
							</thead>

							<tbody>
								{sortedGroup.map((place: any, index: number) => {
									return (
										<tr key={place.rank} className="">
											<td className="mr">
												<img className="object-cover h-3 w-5 mr-2" src={place.team.logo} />
											</td>

											<td className="w-6">{teamsResults[place.team.id].wins}</td>
											<td className="w-6">{teamsResults[place.team.id].draws}</td>
											<td className="w-6">{teamsResults[place.team.id].loses}</td>

											<td className="w-6">{teamsResults[place.team.id].points}</td>
											<td className="ml-2">
												<img
													className="object-cover h-3 w-5 ml-2"
													src={standing[index].team.logo}
												/>
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
