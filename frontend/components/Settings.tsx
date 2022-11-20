import { Fragment, useContext, useEffect, useState } from 'react';
import fileDownload from 'js-file-download';
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Listbox, Transition } from '@headlessui/react';

import UserContext from '../context/UserContext';
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
	fetchStatus,
	fetchTournament,
	fetchLeaderboards,
} from '../pages/api';
import { Competition, Settings, Status } from '../../interfaces/main';
import { competitions } from '../../shared/utils';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { getCompetitionClass } from '../lib/utils/reactHelper';

const SettingsPage = () => {
	const userInfo = useContext(UserContext);
	const [response, setResponse] = useState({});
	const [settings, setSettings] = useState<Settings>();
	const [status, setStatus] = useState<Status>();
	const [competition, setCompetition] = useState<Competition>(competitions.wc2022);

	useEffect(() => {
		const doAsync = async () => {
			if (userInfo) {
				setSettings(await fetchSettings(userInfo?.token));
				setStatus(await fetchStatus(userInfo?.token));
			}
		};
		doAsync();
	}, [userInfo]);

	if (!userInfo || !status || !settings) return <></>;

	const formattedResponse = JSON.stringify(response, null, 2);

	const toggleSetting = (key: string) => {
		const updatedSettings = { ...settings, [key]: !settings?.[key] };
		setSettings(updatedSettings);
		updateSettings(userInfo.token, updatedSettings);
	};

	const { account, subscription, requests } = status;

	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<div className={gcc('text-light')}>
			<div className="m-10 p-3 bg-gray-500 rounded-md flex flex-row flex-wrap">
				<a href="https://dashboard.api-football.com/" target="_blank" rel="noreferrer">
					<img
						className="h-12 w-12 mb-4 absolute right-12"
						src="https://dashboard.api-football.com/public/img/api-sports-small-logo.png"
					/>
				</a>
				<div className="flex flex-col bg-gray-600 p-3 w-max rounded-md m-4">
					<span className="text-lg font-bold mb-3">Account</span>
					<span>{`${account.firstname} ${account.lastname}`}</span>
					<span>{account.email}</span>
				</div>

				<div className="flex flex-col bg-gray-600 p-3 w-max rounded-md m-4">
					<span className="text-lg font-bold mb-3">Subscription</span>
					<span>{subscription.plan}</span>
					<span>{subscription.end}</span>
					<span>{subscription.active ? 'Active' : 'Not Active'}</span>
				</div>

				<div className="flex flex-col bg-gray-600 p-3 w-max rounded-md m-4">
					<span className="text-lg font-bold mb-3">Requests</span>
					<CircularProgressbar
						value={requests.current}
						maxValue={requests.limit_day}
						text={`${requests.current}/${requests.limit_day}`}
						styles={buildStyles({ textSize: '10px' })}
					/>
				</div>
			</div>
			<Listbox value={competition} onChange={setCompetition}>
				<div className="relative mt-1 w-96 m-10">
					<Listbox.Button className="relative w-full cursor-default rounded-lg bg-gray-600 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
						<span className="block truncate">{competition.name}</span>
						<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
							<ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
						</span>
					</Listbox.Button>
					<Transition
						as={Fragment}
						leave="transition ease-in duration-100"
						leaveFrom="opacity-100"
						leaveTo="opacity-0">
						<Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-600 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
							{Object.values(competitions).map(comp => (
								<Listbox.Option
									key={comp.name}
									className={({ active }) =>
										`relative cursor-default select-none py-2 pl-10 pr-4 ${
											active ? 'bg-amber-100 text-amber-900' : 'text-white'
										}`
									}
									value={comp}>
									{({ selected }) => (
										<>
											<span
												className={`block truncate ${
													selected ? 'font-medium' : 'font-normal'
												}`}>
												{comp.name}
											</span>
											{selected ? (
												<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
													<CheckIcon className="h-5 w-5" aria-hidden="true" />
												</span>
											) : null}
										</>
									)}
								</Listbox.Option>
							))}
						</Listbox.Options>
					</Transition>
				</div>
			</Listbox>

			<div className="myi-3 mx-10 p-3 bg-gray-600 rounded-md">
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
					onClick={async () => setResponse(await fetchTournament(userInfo.token, competition))}
					className={`bg-dark text-white font-bold py-2 px-4 rounded m-5`}>
					Fetch Tournament
				</button>

				<button
					onClick={async () => setResponse(await resetStandings(userInfo.token, competition))}
					className={`bg-dark text-white font-bold py-2 px-4 rounded m-5`}>
					Fetch Leaderboard
				</button>
				<button
					onClick={async () => setResponse(await resetFixtures(userInfo.token, competition))}
					className={`bg-dark text-white font-bold py-2 px-4 rounded m-5`}>
					Fetch Fixtures
				</button>

				<button
					onClick={async () => setResponse(await fetchPredictions(userInfo.token, competition))}
					className={`bg-dark text-white font-bold py-2 px-4 rounded m-5`}>
					Fetch Predictions
				</button>

				<button
					onClick={async () => setResponse(await fetchLeaderboards(userInfo.token))}
					className={`bg-dark text-white font-bold py-2 px-4 rounded m-5`}>
					Fetch Leaderboards
				</button>

				<button
					onClick={async () => setResponse(await fetchUsers(userInfo.token, competition))}
					className={`bg-dark text-white font-bold py-2 px-4 rounded m-5`}>
					Fetch Users
				</button>

				<button
					onClick={async () => setResponse(await fetchUsers(userInfo.token, competition))}
					className={`bg-dark text-white font-bold py-2 px-4 rounded m-5`}>
					Fetch Users
				</button>

				<button
					onClick={async () => setResponse(await updatePoints(userInfo.token, competition))}
					className={`bg-dark text-white font-bold py-2 px-4 rounded m-5`}>
					Update Points
				</button>

				<button
					onClick={async () => setResponse(await updateGroups(userInfo.token, competition))}
					className={`bg-dark text-white font-bold py-2 px-4 rounded m-5`}>
					Update Groups
				</button>

				<button
					onClick={() => cleanup(userInfo.token, competition)}
					className={`bg-dark text-white font-bold py-2 px-4 rounded m-5`}>
					Cleanup
				</button>
			</div>

			<div className="bg-gray-700 m-10 rounded-md p-5">
				<div className="flex flex-row items-center justify-between">
					<div className="text-xl font-bold">Response</div>
					<button
						onClick={() =>
							fileDownload(
								formattedResponse,
								`${competition.name}-backup-${new Date().toISOString()}.json`
							)
						}
						className={`bg-dark text-white font-bold py-2 px-4 rounded m-5`}>
						Export
					</button>
				</div>
				<pre className="text-xs overflow-x-scroll">{formattedResponse}</pre>
			</div>
		</div>
	);
};

export default SettingsPage;
