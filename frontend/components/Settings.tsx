import { useContext, useEffect, useState } from 'react';
import UserContext from '../context/UserContext';
import fileDownload from 'js-file-download';
import {
	resetFixtures,
	resetStandings,
	updatePoints,
	cleanup,
	fetchPredictions,
	fetchUsers,
	updateGroups,
	fetchSettings,
	updateSettings,
} from '../pages/api';
import { Settings } from '../../interfaces/main';

const SettingsPage = () => {
	const userInfo = useContext(UserContext);
	const [response, setResponse] = useState({});
	const [settings, setSettings] = useState<Settings>({
		adminHideScores: false,
		allowUpdateFixtures: false,
		allowUpdateStandings: false,
	});

	useEffect(() => {
		const doAsync = async () => {
			if (userInfo) {
				const sets = await fetchSettings(userInfo?.token);
				setSettings(sets);
			}
		};
		doAsync();
	}, [userInfo]);

	if (!userInfo) return <></>;

	const formattedResponse = JSON.stringify(response, null, 2);

	const toggleSetting = (key: string) => {
		const updatedSettings = { ...settings, [key]: !settings?.[key] };
		setSettings(updatedSettings);
		updateSettings(userInfo.token, updatedSettings);
	};

	return (
		<div className="text-light">
			<div className="m-3 p-3 bg-gray-600 rounded-md">
				<label className="inline-flex items-center mt-3 mx-4 cursor-pointer select-none">
					<input
						type="checkbox"
						className="form-checkbox h-5 w-5"
						checked={settings?.adminHideScores}
						onChange={() => toggleSetting('adminHideScores')}
					/>
					<span className="ml-2">Admin Hide Scores</span>
				</label>
				<label className="inline-flex items-center mt-3 mx-4 cursor-pointer select-none">
					<input
						type="checkbox"
						className="form-checkbox h-5 w-5"
						checked={settings?.allowUpdateFixtures}
						onChange={() => toggleSetting('allowUpdateFixtures')}
					/>
					<span className="ml-2">Allow Update Fixtures</span>
				</label>
				<label className="inline-flex items-center mt-3 mx-4 cursor-pointer select-none">
					<input
						type="checkbox"
						className="form-checkbox h-5 w-5"
						checked={settings?.allowUpdateStandings}
						onChange={() => toggleSetting('allowUpdateStandings')}
					/>
					<span className="ml-2">Allow Update Standings</span>
				</label>
			</div>
			<div className="flex flex-col sm:flex-row flex-wrap items-center justify-center">
				<button
					onClick={async () => setResponse(await resetStandings(userInfo.token))}
					className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
					Fetch Rankings
				</button>
				<button
					onClick={async () => setResponse(await resetFixtures(userInfo.token))}
					className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
					Fetch Fixtures
				</button>

				<button
					onClick={async () => setResponse(await fetchPredictions(userInfo.token))}
					className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
					Fetch Predictions
				</button>

				<button
					onClick={async () => setResponse(await fetchUsers(userInfo.token))}
					className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
					Fetch Users
				</button>

				<button
					onClick={async () => setResponse(await updatePoints(userInfo.token))}
					className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
					Update Points
				</button>

				<button
					onClick={async () => setResponse(await updateGroups(userInfo.token))}
					className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
					Update Groups
				</button>

				<button
					onClick={() => cleanup(userInfo.token)}
					className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
					Cleanup
				</button>
			</div>

			<div className="bg-gray-700 m-10 rounded-md p-5">
				<div className="flex flex-row items-center justify-between">
					<div className="text-xl font-bold">Response</div>
					<button
						onClick={() => fileDownload(formattedResponse, `backup-${new Date().toISOString()}.json`)}
						className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
						Export
					</button>
				</div>
				<pre className="text-xs overflow-x-scroll">{formattedResponse}</pre>
			</div>
		</div>
	);
};

export default SettingsPage;
