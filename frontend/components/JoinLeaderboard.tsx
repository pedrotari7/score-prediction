import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from 'react';
import { Leaderboard } from '../../interfaces/main';
import CompetitionContext from '../context/CompetitionContext';
import RouteContext, { Route } from '../context/RouteContext';
import UpdateTournamentContext from '../context/UpdateTournamentContext';
import UserContext from '../context/UserContext';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';
import { fetchLeaderboard, joinLeaderboard } from '../pages/api';
import Loading from './Loading';

const JoinLeaderboard = ({ leaderboardId }: { leaderboardId: string }) => {
	const competition = useContext(CompetitionContext);
	const userInfo = useContext(UserContext);
	const routeInfo = useContext(RouteContext);
	const updateCompetition = useContext(UpdateTournamentContext)!;
	const [loading, setLoading] = useState(false);

	const [leaderboard, setLeaderboard] = useState<Leaderboard>();

	const router = useRouter();

	useEffect(() => {
		const doAsync = async () => {
			if (userInfo) {
				const l = await fetchLeaderboard(leaderboardId, userInfo.token);
				setLeaderboard(l);
			}
		};

		doAsync();
	}, [userInfo, leaderboardId]);

	const gcc = (p: string) => getCompetitionClass(p, competition);

	if (!leaderboard) return <></>;

	return (
		<div
			className={classNames(
				gcc('text-light'),
				'm-12 sm:m-24 p-3 sm:p-6 shadow-pop rounded-md select-none h-full',
				'flex flex-col items-center justify-center gap-12 sm:gap-20'
			)}>
			<div className={classNames('font-bold text-3xl sm:text-4xl md:text-7xl')}>Join Leaderboard</div>
			<div className={classNames('font-bold text-2xl sm:text-3xl md:text-6xl')}>{leaderboard.name}</div>
			<div className={classNames('text-xl')}>{leaderboard.id}</div>
			<div
				onClick={async () => {
					if (userInfo && routeInfo && !loading) {
						setLoading(true);
						await joinLeaderboard(leaderboard.id, userInfo?.token);

						await updateCompetition();

						routeInfo.setRoute({ page: Route.Leaderboard, data: leaderboardId });

						setLoading(false);

						const { pathname, query } = router;
						delete router.query.join;
						router.replace({ pathname, query }, undefined, { shallow: true });
					}
				}}
				className={classNames(
					'font-bold text-3xl p-4 px-6 rounded-md cursor-pointer w-48 h-16 flex justify-center',
					gcc('bg-blue'),
					!loading ? gcc('hover:bg-dark') : ''
				)}>
				{!loading ? <span>Join</span> : <Loading className="w-6 h-6" />}
			</div>
		</div>
	);
};

export default JoinLeaderboard;
