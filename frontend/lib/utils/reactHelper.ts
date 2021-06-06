import { DateTime } from 'luxon';

export const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

export const getCurrentDate = () => {
	return DateTime.now();
	// Mocked date
	// return DateTime.fromISO('2021-06-16T19:00:00+0000');

export const formatScore = (goal: number | null) => {
	if (typeof goal === 'number' && goal >= 0) return goal;
	if (typeof goal === 'number' && goal < 0) return 'H';
	return 'X';
};
