import React, { useContext } from 'react';
import { Fixture } from '../../interfaces/main';
import CompetitionContext from '../context/CompetitionContext';
import GroupMapContext from '../context/GroupMapContext';
import { classNames, getCompetitionClass, GROUP_COLORS } from '../lib/utils/reactHelper';

export const Round = ({ game }: { game: Fixture }) => {
	const groupMap = useContext(GroupMapContext);
	const competition = useContext(CompetitionContext);

	const gcc = (p: string) => getCompetitionClass(p, competition);

	let round = game?.league.round;

	let bgColor = '';

	if (game?.league.round.includes('Group')) {
		const leg = game?.league.round.split('-').pop();
		const group = groupMap[game?.teams.home.name];
		round = group + leg;
		bgColor = GROUP_COLORS[group];
	}

	return (
		<div className={classNames(bgColor, gcc('text-light'), 'items-center rounded-xl px-3 py-1 font-bold')}>
			<span>{round}</span>
		</div>
	);
};
