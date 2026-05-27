import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import type { Leaderboard } from '../../interfaces/main';
import { Route, useTournamentStore } from '../store/tournamentStore';
import useCompetition from '../hooks/useCompetition';
import { classNames } from '../lib/utils/reactHelper';
import { fetchLeaderboard, joinLeaderboard } from '../pages/api';
import Loading from './Loading';

const JoinLeaderboard = ({ leaderboardId, joinToken }: { leaderboardId: string; joinToken?: string }) => {
	const { gcc } = useCompetition();
	const uid = useTournamentStore(s => s.uid);
	const token = useTournamentStore(s => s.token);
	const userInfo = { uid, token };
	const setRoute = useTournamentStore(s => s.setRoute);
	const updateCompetition = useTournamentStore(s => s.updateTournament);
	const [loading, setLoading] = useState(false);

	const [leaderboard, setLeaderboard] = useState<Leaderboard>();

	const router = useRouter();

	useEffect(() => {
		const doAsync = async () => {
			if (userInfo) {
				const l = await fetchLeaderboard(leaderboardId, userInfo.token);

				if (l && l.members.includes(userInfo.uid)) {
					setRoute({ page: Route.Leaderboard, data: leaderboardId });
					const { pathname, query } = router;
					delete router.query.join;
					router.replace({ pathname, query }, undefined, { shallow: true });
				}

				setLeaderboard(l);
			}
		};

		doAsync();
	}, [userInfo, setRoute, router, leaderboardId]);

	if (!leaderboard) return <></>;

	return (
		<div
			className={classNames(
				gcc('text-light'),
				'm-12 h-full select-none rounded-md p-3 shadow-pop sm:m-24 sm:p-6',
				'flex flex-col items-center justify-center gap-12 sm:gap-20'
			)}
		>
			<div className={classNames('text-3xl font-bold sm:text-4xl md:text-7xl')}>Join Leaderboard</div>
			<div className={classNames('text-2xl font-bold sm:text-3xl md:text-6xl')}>{leaderboard.name}</div>
			<div
				onClick={async () => {
					if (userInfo && !loading) {
						setLoading(true);
						await joinLeaderboard(leaderboard.id, userInfo?.token, joinToken);

						await updateCompetition();

						setRoute({ page: Route.Leaderboard, data: leaderboardId });

						setLoading(false);

						const { pathname, query } = router;
						delete router.query.join;
						router.replace({ pathname, query }, undefined, { shallow: true });
					}
				}}
				className={classNames(
					'flex h-16 w-48 cursor-pointer justify-center rounded-md p-4 px-6 text-3xl font-bold',
					gcc('bg-blue'),
					!loading ? gcc('hover:bg-dark') : ''
				)}
			>
				{!loading ? <span>Join</span> : <Loading className='size-6' />}
			</div>
		</div>
	);
};

export default JoinLeaderboard;
