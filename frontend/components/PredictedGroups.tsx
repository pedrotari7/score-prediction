import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Fixtures, Standing, Standings, Predictions } from '../../interfaces/main';
import { calculateResults, competitions, sortGroup, sortWorldCupGroup } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import useNoSpoilers from '../hooks/useNoSpoilers';
import { classNames, GROUP_COLORS } from '../lib/utils/reactHelper';
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
	const { RedactedSpoilers } = useNoSpoilers();
	const { gcc, competition } = useCompetition();

	const teamsResults = calculateResults(Object.values(fixtures), predictions, userID);

	const TickIcon = ({ disable }: { disable: boolean }) => (
		<CheckIcon className={classNames('h-5 w-5', disable ? 'text-green-500' : 'text-yellow-500')} />
	);
	const CloseIcon = ({ disable }: { disable: boolean }) => (
		<XMarkIcon className={classNames('h-5 w-5', disable ? 'text-red-500' : 'text-yellow-500')} />
	);

	return (
		<div className='flex flex-row flex-wrap justify-center'>
			{standings.map(([title, standing]) => {
				const group = title.split(' ').pop();

				if (group?.length !== 1) return null;

				const teamsIDs = standing.map(t => t.team.id);

				const sortFn = competition.name === competitions.wc2022.name ? sortWorldCupGroup : sortGroup;

				const sortedGroup = sortFn(teamsIDs, teamsResults, fixtures, predictions, userID).map(
					teamID => standing.find(el => el.team.id === teamID)!
				);

				const hasFinished = sortedGroup.every(s => s.all.played === teamsIDs.length - 1);

				return (
					<div
						key={title}
						className={classNames(
							gcc('bg-dark'),
							`m-2 flex flex-col rounded-md p-4 text-center shadow-pop`
						)}
					>
						<h2
							className={classNames(
								gcc('text-light'),
								GROUP_COLORS[group],
								'mb-4 rounded-md pl-2 text-left text-2xl font-bold'
							)}
						>
							{title}
						</h2>
						<table className={classNames(gcc('text-light'))}>
							<thead>
								<tr className='text-center'>
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
										<tr key={place.rank} className=''>
											<td className='mr'>
												<Flag team={place.team} />
											</td>

											<td className='w-6'>{wins}</td>
											<td className='w-6'>{draws}</td>
											<td className='w-6'>{loses}</td>

											<td className='w-6'>{ga}</td>
											<td className='w-6'>{gc}</td>
											<td className='w-6'>{ga - gc}</td>

											<td className='w-6'>{points}</td>
											<td className=''>
												<div className='flex flex-row items-center justify-center'>
													<RedactedSpoilers withIcon iconStyle='w-4 h-4'>
														<>
															<Flag team={standing[index].team} />
															{isCorrectPrediction
																? hasGames && <TickIcon disable={hasFinished} />
																: hasGames && <CloseIcon disable={hasFinished} />}
														</>
													</RedactedSpoilers>
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
