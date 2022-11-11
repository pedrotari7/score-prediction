import { useContext } from 'react';
import CompetitionContext from '../context/CompetitionContext';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';

const Rules = () => {
	const competition = useContext(CompetitionContext);
	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<div
			className={classNames(
				gcc('text-light'),
				gcc('bg-dark'),
				`flex flex-col justify-center select-none  m-8 p-8 shadow-pop rounded-md`,
				'mx-8 md:mx-24 lg:mx-48'
			)}>
			<div className="font-bold mb-4 text-4xl">Rules</div>
			<div className="font-bold text-2xl mb-4">Points in each game</div>
			<div className="rounded-md p-2 mb-4 bg-green-500 flex flex-row flex-wrap text-lg">
				Exact Score (right outcome of the game and exact number of goals scored by both teams)
				<span className="font-bold text-2xl mt-2 w-full">+5 Points</span>
			</div>
			<div className="rounded-md p-2 mb-4 bg-yellow-500 flex flex-row flex-wrap text-lg">
				Correct Result (right outcome of the game, but wrong number of goals of at least one of the teams)
				<span className="font-bold text-2xl mt-2 w-full">+3 Points</span>
			</div>
			<div className="rounded-md p-2 mb-4 bg-pink-500 flex flex-row flex-wrap text-lg">
				Right number of goals from one of the teams
				<span className="font-bold text-2xl mt-2 w-full">+1 Point</span>
			</div>
			<div className="rounded-md p-2 mb-4 bg-red-500 flex flex-row flex-wrap text-lg">
				None of the above
				<span className="font-bold text-2xl mt-2 w-full">+0 Points</span>
			</div>
			<div className="mb-4">
				You are only awarded points once per game, so from the bullet points above you will receive the one that
				awards you the highest number of points. Each game will be colored with the respective point color.
			</div>
			<div>
				<div className="font-bold text-2xl mb-4">Groups</div>
				<div className="bg-purple-700 rounded-md p-2 mb-4 flex flex-row flex-wrap text-lg">
					You will be awarded 1 point per each succesful guess on a team&apos;s final position in the group
					stage.
					<span className="font-bold text-2xl mt-2 w-full">+1 Point</span>
				</div>
			</div>
			<div className="mb-4">
				<div className="font-bold text-2xl mb-4">Final Stages</div>
				In the final stages of the tournament each game is similar to the group stage games, but in this case
				your prediction will be compared with the result at the end of the 90 or 120 minutes.
				<div className="bg- bg-gray-500 rounded-md p-2 my-4 ">
					Nonetheless, in case of penalty shootout if you guessed correctly the team that ends up going
					through to the next stage, you will be awarded 1 extra point that adds to the ones that you might
					have acheived during the regular time.
				</div>
			</div>
			<div className="">
				<div className="font-bold text-2xl mb-4">Deadlines</div>
				In the group stages the predictions for each game must be done before its start. For the final stages
				games, the predictions will be available once the matchup is known and have to be submited before the
				game starts.
			</div>
		</div>
	);
};

export default Rules;
