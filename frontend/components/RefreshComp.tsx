import React, { useContext } from 'react';
import UpdateTournamentContext from '../context/UpdateTournamentContext';
import RefreshButton from './RefreshButton';

const RefreshComp = () => {
	const updateCompetition = useContext(UpdateTournamentContext)!;

	return <RefreshButton onClick={updateCompetition}></RefreshButton>;
};

export default RefreshComp;
