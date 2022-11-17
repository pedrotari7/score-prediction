import { ArrowPathIcon } from '@heroicons/react/24/outline';
import React, { useContext } from 'react';
import CompetitionContext from '../context/CompetitionContext';
import UpdateTournamentContext from '../context/UpdateTournamentContext';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';

const RefreshComp = () => {
	const competition = useContext(CompetitionContext);
	const updateCompetition = useContext(UpdateTournamentContext)!;

	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<ArrowPathIcon
			className={classNames(gcc('text-light'), 'h-6 w-6', 'hover:opacity-80 cursor-pointer')}
			onClick={() => updateCompetition()}
		/>
	);
};

export default RefreshComp;
