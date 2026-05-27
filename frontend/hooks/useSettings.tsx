import { useCallback, useEffect, useState } from 'react';
import { Settings } from '../../interfaces/main';
import { useTournamentStore } from '../store/tournamentStore';
import { fetchSettings, updateSettings } from '../pages/api';

const useSettings = () => {
	const [loading, setLoading] = useState(false);
	const [settings, setSettings] = useState<Settings>({
		adminHideScores: false,
		allowUpdateFixtures: false,
		allowUpdateStandings: false,
		disableLiveScoresApi: false,
		allowUpdatePoints: false,
	});
	const token = useTournamentStore(s => s.token);

	const update = useCallback(async () => {
		setLoading(true);
		if (token) {
			setSettings(await fetchSettings(token));
		}
		setLoading(false);
	}, [token]);

	const toggleSetting = useCallback(
		async (key: keyof Settings) => {
			const updatedSettings = { ...settings, [key]: !settings?.[key] } as Settings;

			setSettings(updatedSettings);
			if (token) {
				await updateSettings(token, updatedSettings);
			}
		},
		[settings]
	);

	useEffect(() => {
		update();
	}, [update]);

	return { settings, loading, update, toggleSetting };
};

export default useSettings;
