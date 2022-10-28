import { useContext } from 'react';
import { Fixtures, Standing, Standings, Predictions } from '../../interfaces/main';
import { calculateResults, sortGroup } from '../../shared/utils';
import CompetitionContext from '../context/CompetitionContext';
import Flag from './Flag';

const PredictedGroups = ({
	standings,
	fixtures,
	predictions,
	userID,
}: {
	standings: Standings;
	fixtures: Fixtures;
	predictions: Predictions;
	userID: string;
}) => {
	const competition = useContext(CompetitionContext);

	const teamsResults = calculateResults(Object.values(fixtures), predictions, userID);

	const TickIcon = () => <img className="h-5 w-5 p-1 mx-1" src="/tick.svg" />;
	const CloseIcon = () => <img className="h-5 w-5 p-1 mx-1" src="/close.svg" />;

	return (
		<div className="flex flex-row flex-wrap justify-center">
			{standings.map(([title, standing]) => {
				const group = title.split(' ').pop();

				if (group?.length !== 1) return null;

				const teamsIDs = standing.map(t => t.team.id);

				const sortedGroup = sortGroup(teamsIDs, teamsResults, fixtures, predictions, userID).map(
					teamID => standing.find(el => el.team.id === teamID)!
				);

				return (
					<div
						key={title}
						className={`m-2 p-4 shadow-pop rounded-md text-center flex flex-col bg-dark-${competition.name}`}>
						<h2 className={`text-2xl text-light-${competition.name} mb-4 text-left`}>{title}</h2>
						<table className={`text-light-${competition.name}`}>
							<thead>
								<tr className="text-center">
									<th></th>
									<th>W</th>
									<th>D</th>
									<th>L</th>
									<th>GF</th>
									<th>GA</th>
									<th>GD</th>
									<th>P</th>
									<th>Real</th>
								</tr>
							</thead>

							<tbody>
								{sortedGroup.map((place: Standing, index: number) => {
									const isCorrectPrediction = standing[index].team.id === place.team.id;
									const hasGames = standing[index].all.played > 0;

									const { wins, draws, loses, points, ga, gc } = teamsResults[place.team.id];
									return (
										<tr key={place.rank} className="">
											<td className="mr">
												<Flag team={place.team} />
											</td>

											<td className="w-6">{wins}</td>
											<td className="w-6">{draws}</td>
											<td className="w-6">{loses}</td>

											<td className="w-6">{ga}</td>
											<td className="w-6">{gc}</td>
											<td className="w-6">{ga - gc}</td>

											<td className="w-6">{points}</td>
											<td className="ml-2">
												<div className="flex flex-row justify-start items-center">
													<Flag team={standing[index].team} />
													{isCorrectPrediction
														? hasGames && <TickIcon />
														: hasGames && <CloseIcon />}
												</div>
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
