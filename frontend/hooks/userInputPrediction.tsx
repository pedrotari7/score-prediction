import { DateTime } from 'luxon';
import React, { ChangeEvent, useCallback, useContext, useRef } from 'react';
import { Fixture, Prediction } from '../../interfaces/main';
import { isNum } from '../../shared/utils';
import ScoreInput from '../components/ScoreInput';
import RouteContext, { Route } from '../context/RouteContext';
import UserContext from '../context/UserContext';
import { getCurrentDate } from '../lib/utils/reactHelper';

export const userInputPrediction = (
	gameID: number,
	prediction: Prediction,
	updatePrediction: (prediction: Prediction) => Promise<void>
) => {
	const homeInputRef = useRef<HTMLInputElement>(null);
	const awayInputRef = useRef<HTMLInputElement>(null);
	const { setRoute } = useContext(RouteContext)!;

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
		[prediction]
	);

	const UserInputPrediction = () => {
		const onPredictionChange = useCallback(
			async (e: ChangeEvent<HTMLInputElement>, team: string) => {
				const value = parseInt(e.target.value);
				await updatePrediction({ ...prediction, [team]: isNaN(value) ? null : value });
			},
			[prediction]
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

	return { UserInputPrediction, handleContainerClick };
};
