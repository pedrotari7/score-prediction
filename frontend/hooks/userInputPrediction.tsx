import React, { ChangeEvent, useRef } from 'react';
import { Prediction } from '../../interfaces/main';
import ScoreInput from '../components/ScoreInput';

export const userInputPrediction = (gameID: string, updatePrediction: (prediction: Prediction) => Promise<void>) => {
	const homeInputRef = useRef<HTMLInputElement>(null);
	const awayInputRef = useRef<HTMLInputElement>(null);

	const UserInputPrediction = ({ prediction }: { prediction: Prediction }) => {
		const onPredictionChange = async (e: ChangeEvent<HTMLInputElement>, team: string) => {
			const value = parseInt(e.target.value);
			await updatePrediction({ ...prediction, [team]: isNaN(value) ? null : value });
		};

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

	return { UserInputPrediction, homeInputRef, awayInputRef };
};
