import React from 'react';
import { useTournamentStore } from '../store/tournamentStore';
import RefreshButton from './RefreshButton';

const RefreshComp = () => {
	const updateCompetition = useTournamentStore(s => s.updateTournament);

	return <RefreshButton onClick={updateCompetition}></RefreshButton>;
};

export default RefreshComp;
