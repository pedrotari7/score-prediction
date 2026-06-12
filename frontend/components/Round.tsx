import React from 'react';
import type { Fixture } from '../../interfaces/main';
import { useTournamentStore } from '../store/tournamentStore';
import useCompetition from '../hooks/useCompetition';
import { classNames, GROUP_COLORS } from '../lib/utils/reactHelper';

export const Round = ({ game }: { game: Fixture }) => {
	const groupMap = useTournamentStore(s => s.groupMap);
	const { gcc } = useCompetition();

	let round = game?.league.round;

	let bgColor = '';

	if (game?.league.round.includes('Group')) {
		const leg = game?.league.round.split('-').pop();
		const group = groupMap[game?.teams.home.id];
		if (group) {
			round = group + leg;
			bgColor = GROUP_COLORS[group];
		}
	}

	return (
		<div className={classNames(bgColor, gcc('text-light'), 'items-center rounded-xl px-3 py-1 font-bold')}>
			<span>{round}</span>
		</div>
	);
};
