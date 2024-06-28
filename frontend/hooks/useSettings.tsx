import { useCallback, useContext, useEffect, useState } from 'react';
import { Settings } from '../../interfaces/main';
import UserContext from '../context/UserContext';
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
	const userInfo = useContext(UserContext);

	const update = useCallback(async () => {
		setLoading(true);
		if (userInfo) {
			setSettings(await fetchSettings(userInfo?.token));
		}
		setLoading(false);
	}, [userInfo]);

	const toggleSetting = useCallback(
		async (key: keyof Settings) => {
			const updatedSettings = { ...settings, [key]: !settings?.[key] } as Settings;

			setSettings(updatedSettings);
			if (userInfo) {
				await updateSettings(userInfo.token, updatedSettings);
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
