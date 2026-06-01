import type { ChangeEvent } from 'react';
import React, { useCallback, useRef } from 'react';
import type { Prediction, UpdatePrediction } from '../../interfaces/main';
import { isNum } from '../../shared/utils';
import ScoreInput from '../components/ScoreInput';
import { Route, useTournamentStore } from '../store/tournamentStore';

interface UserInputPredictionProps {
	gameID: number;
	prediction: Prediction;
	updatePrediction: UpdatePrediction;
	homeInputRef: React.RefObject<HTMLInputElement | null>;
	awayInputRef: React.RefObject<HTMLInputElement | null>;
}

export const UserInputPrediction = ({
	gameID,
	prediction,
	updatePrediction,
	homeInputRef,
	awayInputRef,
}: UserInputPredictionProps) => {
	const onPredictionChange = useCallback(
		async (e: ChangeEvent<HTMLInputElement>, team: string) => {
			const value = parseInt(e.target.value);
			await updatePrediction({ ...prediction, [team]: isNaN(value) ? null : value }, gameID);
		},
		[prediction, gameID, updatePrediction]
	);

	return (
		<>
			<ScoreInput
				innerRef={homeInputRef}
				id={`${gameID}-home`}
				value={prediction.home}
				className='mx-2'
				onchange={async (e: ChangeEvent<HTMLInputElement>) => await onPredictionChange(e, 'home')}
			/>

			<ScoreInput
				innerRef={awayInputRef}
				id={`${gameID}-away`}
				value={prediction.away}
				className='mx-2'
				onchange={async (e: ChangeEvent<HTMLInputElement>) => await onPredictionChange(e, 'away')}
			/>
		</>
	);
};

export const useInputPrediction = (gameID: number, prediction: Prediction) => {
	const homeInputRef = useRef<HTMLInputElement>(null);
	const awayInputRef = useRef<HTMLInputElement>(null);
	const setRoute = useTournamentStore(s => s.setRoute);

	const isValidScore = (n: number | null) => isNum(n) && n >= 0;

	const handleContainerClick = useCallback(
		(isMyPredictions: boolean) => {
			const hasBothPredictions = isValidScore(prediction.home) && isValidScore(prediction.away);

			if (hasBothPredictions || !isMyPredictions) {
				return setRoute({ page: Route.Match, data: gameID });
			}
			if (!isValidScore(prediction.home)) return homeInputRef.current?.focus();
			return awayInputRef.current?.focus();
		},
		[prediction, gameID]
	);

	return { homeInputRef, awayInputRef, handleContainerClick };
};
