import { DateTime } from 'luxon';
import { Fixture, Prediction, Result, UserResult } from '../../../interfaces/main';

export const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

export const getCurrentDate = () => {
	return DateTime.now();
	// Mocked date
	// return DateTime.fromISO('2021-06-16T19:00:00+0000');
	// return DateTime.fromISO('2016-06-09T19:00:00+0000');
};

export const formatScore = (goal: number | null) => {
	if (typeof goal === 'number' && goal >= 0) return goal;
	if (typeof goal === 'number' && goal < 0) return 'H';
	return 'X';
};

export const isNum = (n: number | null) => typeof n === 'number';

export const getOutcome = (g: Result): string | null => {
	if (!isNum(g.home) || !isNum(g.away)) return null;
	if (g.home > g.away) return 'winH';
	if (g.home < g.away) return 'winA';
	if (g.home === g.away) return 'draw';
	return null;
};

export const getResult = (prediction: Prediction, result: Result): Partial<UserResult> => {
	const { home: predH, away: predA } = prediction;
	const { home: realH, away: realA } = result;

	const isExactScore = predH === realH && predA === realA;

	if (isExactScore) return { points: 5, exact: 1 };

	const isCorrectResult =
		!isExactScore && getOutcome(prediction) !== null && getOutcome(prediction) === getOutcome(result);

	if (isCorrectResult) return { points: 3, result: 1 };

	const isCorrectGoal = !isExactScore && !isCorrectResult && (predH === realH || predA === realA);

	if (isCorrectGoal) return { points: 1, onescore: 1 };

	return { points: 0, fail: 1 };
};

export const isGameFinished = (game: Fixture) => ['FT', 'AET', 'PEN'].includes(game.fixture.status.short);
