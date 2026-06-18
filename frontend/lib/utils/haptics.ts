export const haptic = (pattern: number | number[] = 10) => {
	if (typeof navigator !== 'undefined' && navigator.vibrate) {
		navigator.vibrate(pattern);
	}
};

export const hapticLight = () => haptic(10);
export const hapticMedium = () => haptic(25);
export const hapticHeavy = () => haptic([30, 50, 60]);
