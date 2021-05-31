import { DateTime } from 'luxon';

export const classNames = (...classes: any[]) => classes.filter(Boolean).join(' ');

export const getCurrentDate = () => {
	return DateTime.now();
	// Mocked date
	// return DateTime.fromISO('2021-06-16T19:00:00+0000');
};
