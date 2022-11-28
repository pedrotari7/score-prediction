import { useContext } from 'react';
import RouteContext, { Route, RouteInfo } from '../context/RouteContext';
import useCompetition from '../hooks/useCompetition';
import { classNames } from '../lib/utils/reactHelper';

export const ExactScore = () => (
	<div className='mb-4 flex flex-row flex-wrap rounded-md bg-green-600 p-2 text-lg'>
		Exact Score (right outcome of the game and exact number of goals scored by both teams)
		<span className='mt-2 w-full text-2xl font-bold'>+5 Points</span>
	</div>
);

export const CorrectResult = () => (
	<div className='mb-4 flex flex-row flex-wrap rounded-md bg-yellow-600 p-2 text-lg'>
		Correct Result (right outcome of the game, but wrong number of goals of at least one of the teams)
		<span className='mt-2 w-full text-2xl font-bold'>+3 Points</span>
	</div>
);

export const RightGoals = () => (
	<div className='mb-4 flex flex-row flex-wrap rounded-md bg-pink-600 p-2 text-lg'>
		Right number of goals from one of the teams
		<span className='mt-2 w-full text-2xl font-bold'>+1 Point</span>
	</div>
);

export const NoPoints = () => (
	<div className='mb-4 flex flex-row flex-wrap rounded-md bg-red-600 p-2 text-lg'>
		None of the above
		<span className='mt-2 w-full text-2xl font-bold'>+0 Points</span>
	</div>
);

export const ExtraInfo = () => (
	<div className='mb-4'>
		You are only awarded points once per game, so from the bullet points above you will receive the one that awards
		you the highest number of points. Each game will be colored with the respective point color.
	</div>
);

export const GroupsPoints = () => (
	<div>
		<div className='mb-4 text-2xl font-bold'>Groups</div>
		<div className='mb-4 flex flex-row flex-wrap rounded-md bg-purple-700 p-2 text-lg'>
			You will be awarded 1 point per each successful guess on a team&apos;s final position in the group stage.
			<span className='mt-2 w-full text-2xl font-bold'>+1 Point</span>
		</div>
	</div>
);

export const FinalStages = () => (
	<div className='mb-4'>
		<div className='mb-4 text-2xl font-bold'>Final Stages</div>
		In the final stages of the tournament each game is similar to the group stage games, but in this case your
		prediction will be compared with the result at the end of the 90 or 120 minutes.
		<div className='bg- my-4 rounded-md bg-gray-500 p-2 '>
			Nonetheless, in case of penalty shootout if you guessed correctly the team that ends up going through to the
			next stage, you will be awarded 1 extra point that adds to the ones that you might have achieved during the
			regular time.
		</div>
	</div>
);

export const Deadlines = () => (
	<div className=''>
		<div className='mb-4 text-2xl font-bold'>Deadlines</div>
		In the group stages the predictions for each game must be done before its start. For the final stages games, the
		predictions will be available once the matchup is known and have to be submitted before the game starts.
	</div>
);

const Rules = () => {
	const { gcc } = useCompetition();

	const routeInfo = useContext(RouteContext);

	if (!routeInfo) return <></>;

	const { setRoute, route } = routeInfo;

	const updateRoute = (info: RouteInfo) => setRoute(info);

	return (
		<>
			<div
				className={classNames(
					gcc('text-light'),
					gcc('bg-dark'),
					`m-8 flex select-none flex-col  justify-center rounded-md p-8 shadow-pop`,
					'mx-8 md:mx-24 lg:mx-48'
				)}
			>
				<div className='mb-4 text-4xl font-bold'>Rules</div>
				<div className='mb-4 text-2xl font-bold'>Points in each game</div>
				<ExactScore />
				<CorrectResult />
				<RightGoals />
				<NoPoints />
				<ExtraInfo />
				<GroupsPoints />
				<FinalStages />
				<Deadlines />
			</div>
			<div
				className={classNames(
					gcc('text-light'),
					`m-8 flex select-none flex-col  justify-center rounded-md p-8`,
					'mx-8 mb-10 md:mx-24 lg:mx-48'
				)}
			></div>
			<div
				className={classNames(
					gcc('bg-light'),
					'fixed bottom-4 right-4 cursor-pointer rounded-md p-4 font-bold shadow-pop'
				)}
				onClick={() => updateRoute({ page: Route.Predictions, data: route.data })}
			>
				My Predictions
			</div>
		</>
	);
};

export default Rules;
