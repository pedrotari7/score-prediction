import { useCallback, useRef, useSyncExternalStore } from 'react';

const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
	const listeners = useRef(new Set<() => void>());

	const subscribe = useCallback((callback: () => void) => {
		listeners.current.add(callback);
		return () => {
			listeners.current.delete(callback);
		};
	}, []);

	const getSnapshot = useCallback(() => {
		const item = localStorage.getItem(key);
		if (item === null) return initialValue;
		try {
			return JSON.parse(item) as T;
		} catch {
			return initialValue;
		}
	}, [key, initialValue]);

	const getServerSnapshot = useCallback(() => initialValue, [initialValue]);

	const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	const setValue = useCallback(
		(newValue: T) => {
			localStorage.setItem(key, JSON.stringify(newValue));
			listeners.current.forEach(l => l());
		},
		[key]
	);

	return [value, setValue];
};

export default useLocalStorage;
