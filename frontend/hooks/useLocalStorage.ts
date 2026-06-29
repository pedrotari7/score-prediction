import { useState, useCallback, useEffect } from 'react';

const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
	const [storedValue, setStoredValue] = useState<T>(initialValue);

	useEffect(() => {
		const item = localStorage.getItem(key);
		if (item !== null) {
			try {
				setStoredValue(JSON.parse(item) as T);
			} catch {
				// ignore malformed values
			}
		}
	}, [key]);

	const setValue = useCallback(
		(value: T) => {
			setStoredValue(value);
			localStorage.setItem(key, JSON.stringify(value));
		},
		[key]
	);

	return [storedValue, setValue];
};

export default useLocalStorage;
